import initSqlJs from 'sql.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFinalStatement, type TabularQueryResult } from '../../../shared/sqlExec.js'
import { resultsMatch } from '../../../shared/grading/sqlGrading.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Same seed data SQL Practice uses in the browser (client/src/lib/sqlEngine.ts)
// — one schema, one source of truth, so a question can never grade
// differently server-side than it did for the learner client-side.
const SEED_SQL_PATH = path.join(__dirname, '../../../datasets/seed.sql')
const seedSql = fs.readFileSync(SEED_SQL_PATH, 'utf8')

let sqlJsPromise: ReturnType<typeof initSqlJs> | null = null

/** Loads the sql.js WASM runtime once per process. Under Node (unlike the
 * browser build) sql.js resolves its own .wasm file relative to its
 * installed location by default — no locateFile/public-folder copy needed
 * here, that workaround was specifically a Vite/browser resolution quirk. */
function loadSqlJs() {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs()
  }
  return sqlJsPromise
}

/** Runs `sql` against a fresh in-memory database pre-loaded with the sample
 * schema. A fresh database per call — never reused across requests — is
 * what makes it safe to run arbitrary learner SQL here: nothing persists
 * past this function returning, and sql.js has no filesystem or network
 * access of its own to escape through. */
export async function runQuery(sql: string): Promise<TabularQueryResult> {
  const SQL = await loadSqlJs()
  const db = new SQL.Database()
  try {
    db.run(seedSql)
    return execFinalStatement(db, sql)
  } finally {
    db.close()
  }
}

export interface SqlGradeResult {
  isCorrect: boolean
}

/** Independently re-grades a submission for an Interview-tier question —
 * the point of Phase 6's server-side mode. Runs the solution query itself
 * (never the client-supplied "expected" anything) and compares it against
 * the submission using the exact same resultsMatch used client-side.
 *
 * Throws only on a genuine infra problem (the solution query itself failing
 * to execute — a content bug, since solutionQuery is curated, not learner
 * input). A submitted query that fails to run is not an infra problem —
 * that's just an incorrect answer, so it resolves to isCorrect: false
 * rather than throwing. */
export async function gradeSqlServerSide(
  solutionQuery: string,
  orderMatters: boolean,
  submittedQuery: string,
): Promise<SqlGradeResult> {
  let expected: TabularQueryResult
  try {
    expected = await runQuery(solutionQuery)
  } catch (err) {
    throw new Error(
      `Solution query failed to execute server-side (content bug, not a learner error): ${
        err instanceof Error ? err.message : String(err)
      }`,
    )
  }

  let actual: TabularQueryResult
  try {
    actual = await runQuery(submittedQuery)
  } catch {
    return { isCorrect: false }
  }

  return { isCorrect: resultsMatch(actual, expected, orderMatters) }
}
