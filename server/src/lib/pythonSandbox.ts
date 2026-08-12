import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DatasetBinding } from '../../../shared/types.js'
import { valuesMatch } from '../../../shared/grading/pythonGrading.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCRIPT_PATH = path.join(__dirname, '../../python/run_sandboxed.py')
// Same CSV files the client's Pyodide engine reads (see
// client/src/lib/pythonEngine.ts) — one dataset directory, one source of
// truth, so an exercise can't grade differently server-side than it did
// for the learner client-side.
const DATASETS_CSV_DIR = path.join(__dirname, '../../../datasets/csv')
const PYTHON_BIN = process.env.PYTHON_BIN || 'python'
const TIMEOUT_MS = 10_000

interface SandboxRunResult {
  stdout: string
  error: string | null
  value: unknown
}

/** DatasetBinding.file is a Pyodide virtual-filesystem path like
 * '/data/employees.csv' (see shared/types.ts) — meaningless outside the
 * browser. Resolve it to the real CSV file on disk instead. */
function resolveDatasetPath(virtualPath: string): string {
  const filename = path.basename(virtualPath)
  return path.join(DATASETS_CSV_DIR, filename)
}

/** Spawns a fresh `python run_sandboxed.py` process per call — never
 * reused across requests — and pipes {code, checkVar, datasets} to it as
 * JSON on stdin. A hard wall-clock timeout guards against both infinite
 * loops and (defense in depth) anything that manages to hang despite the
 * sandbox restrictions. See server/python/run_sandboxed.py for what "sandbox"
 * does and doesn't mean here — read that before treating this as more than
 * best-effort isolation. */
function runInSandbox(
  code: string,
  checkVar: string,
  datasets: DatasetBinding[],
): Promise<SandboxRunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [SCRIPT_PATH], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      child.kill('SIGKILL')
      reject(new Error(`Python sandbox timed out after ${TIMEOUT_MS}ms`))
    }, TIMEOUT_MS)

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })
    child.on('error', (err) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(err)
    })
    child.on('close', (exitCode) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (exitCode !== 0) {
        reject(new Error(`Python sandbox exited with code ${exitCode}: ${stderr.slice(0, 500)}`))
        return
      }
      try {
        resolve(JSON.parse(stdout) as SandboxRunResult)
      } catch {
        reject(new Error(`Python sandbox returned non-JSON output: ${stdout.slice(0, 500)}`))
      }
    })

    const resolvedDatasets = datasets.map((ds) => ({
      variable: ds.variable,
      file: resolveDatasetPath(ds.file),
    }))
    child.stdin.write(JSON.stringify({ code, checkVar, datasets: resolvedDatasets }))
    child.stdin.end()
  })
}

let availabilityPromise: Promise<boolean> | null = null

/** Checks once per server process whether `python`, RestrictedPython, and
 * pandas/numpy are actually available, and caches the result — so a
 * missing Python install doesn't mean spawning (and waiting out the
 * timeout on) a doomed subprocess for every single Interview submission. */
export function isPythonSandboxAvailable(): Promise<boolean> {
  if (!availabilityPromise) {
    availabilityPromise = new Promise((resolve) => {
      const child = spawn(PYTHON_BIN, ['-c', 'import RestrictedPython, pandas, numpy'], {
        stdio: 'ignore',
      })
      child.on('error', () => resolve(false))
      child.on('close', (code) => resolve(code === 0))
    })
  }
  return availabilityPromise
}

export interface PythonGradeResult {
  isCorrect: boolean
}

/** Independently re-grades a submission for an Interview-tier exercise —
 * the point of Phase 6's server-side mode. Runs the solution code itself
 * (never anything client-supplied) through the sandbox and compares it
 * against the submission using the exact same valuesMatch used
 * client-side.
 *
 * Throws only on a genuine infra problem (the solution code itself failing
 * in the sandbox — a content bug, since solutionCode is curated, not
 * learner input). A submission that errors or times out in the sandbox is
 * not an infra problem — that's just an incorrect/broken answer, so it
 * resolves to isCorrect: false rather than throwing. */
export async function gradePythonServerSide(
  solutionCode: string,
  datasets: DatasetBinding[],
  submittedCode: string,
): Promise<PythonGradeResult> {
  const expected = await runInSandbox(solutionCode, 'result', datasets)
  if (expected.error) {
    throw new Error(
      `Solution code failed in the sandbox (content bug, not a learner error): ${expected.error}`,
    )
  }

  let actual: SandboxRunResult
  try {
    actual = await runInSandbox(submittedCode, 'result', datasets)
  } catch {
    // Timeout, crash, or a RestrictedPython compile rejection (e.g. the
    // learner's code tried a blocked construct) — all of these are the
    // submission's fault, not the server's, so they grade as incorrect
    // rather than falling back to trusting the client.
    return { isCorrect: false }
  }
  if (actual.error) {
    return { isCorrect: false }
  }

  return { isCorrect: valuesMatch(actual.value, expected.value) }
}
