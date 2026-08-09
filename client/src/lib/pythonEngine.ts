import { loadPyodide, type PyodideInterface } from 'pyodide'

// Same source data as the SQL Practice track (see datasets/README.md) —
// exported to CSV so pandas can read it directly.
import departmentsCsv from '../../../datasets/csv/departments.csv?raw'
import employeesCsv from '../../../datasets/csv/employees.csv?raw'
import customersCsv from '../../../datasets/csv/customers.csv?raw'
import productsCsv from '../../../datasets/csv/products.csv?raw'
import ordersCsv from '../../../datasets/csv/orders.csv?raw'
import salesCsv from '../../../datasets/csv/sales.csv?raw'
import employeesMessyCsv from '../../../datasets/csv/employees_messy.csv?raw'

const CSV_FILES: Record<string, string> = {
  '/data/departments.csv': departmentsCsv,
  '/data/employees.csv': employeesCsv,
  '/data/customers.csv': customersCsv,
  '/data/products.csv': productsCsv,
  '/data/orders.csv': ordersCsv,
  '/data/sales.csv': salesCsv,
  '/data/employees_messy.csv': employeesMessyCsv,
}

// Pinned to the exact version of the `pyodide` npm package (see
// package.json) so the runtime fetched from the CDN always matches the API
// this file was written against. Unlike sql.js, Pyodide's full package set
// (numpy/pandas/matplotlib wheels) is too large to vendor into this repo, so
// it's loaded from Pyodide's official CDN instead of client/public/.
const PYODIDE_VERSION = '314.0.3'

export interface DatasetBinding {
  /** Python variable name the CSV should be loaded into, e.g. 'employees_df'. */
  variable: string
  /** Key into CSV_FILES, e.g. '/data/employees.csv'. */
  file: string
}

export interface PythonRunResult {
  stdout: string
  error: string | null
  /** JSON-shaped value of the exercise's check variable, or null if none was
   * requested. DataFrames/Series arrive as {__type__, columns/values, rows}. */
  value: unknown
  /** Base64-encoded PNG (no data: prefix) if the code produced a plot. */
  image: string | null
}

// Defined once per Pyodide instance, then invoked per run via runPythonAsync
// below. Keeping this as one Python function (rather than composing several
// runPython calls per exercise) keeps stdout capture, namespace isolation,
// and plot capture atomic — no run can observe another run's state.
const SETUP_CODE = `
import sys, io, json, base64, traceback
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

def _to_jsonable(value):
    if isinstance(value, pd.DataFrame):
        return {
            '__type__': 'dataframe',
            'index': [str(i) for i in value.index],
            'columns': [str(c) for c in value.columns],
            'rows': value.values.tolist(),
        }
    if isinstance(value, pd.Series):
        # The index carries meaning here (e.g. department_id in a groupby
        # result) — dropping it, as an earlier version of this did, would
        # silently make "which group is which" unrecoverable.
        return {
            '__type__': 'series',
            'name': value.name,
            'index': [str(i) for i in value.index],
            'values': value.tolist(),
        }
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, (int, float, str, bool)) or value is None:
        return value
    if isinstance(value, (list, tuple)):
        return [_to_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {str(k): _to_jsonable(v) for k, v in value.items()}
    return str(value)

def __run_cell(code, check_var, datasets_json):
    plt.close('all')
    namespace = {'pd': pd, 'np': np, 'plt': plt}
    for ds in json.loads(datasets_json):
        namespace[ds['variable']] = pd.read_csv(ds['file'])

    old_stdout = sys.stdout
    sys.stdout = io.StringIO()
    error = None
    try:
        exec(code, namespace)
    except Exception:
        error = traceback.format_exc()
    stdout_text = sys.stdout.getvalue()
    sys.stdout = old_stdout

    value = None
    if error is None and check_var:
        if check_var in namespace:
            value = _to_jsonable(namespace[check_var])
        else:
            error = "Your code must define a variable named '" + check_var + "'."

    image = None
    if plt.get_fignums():
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        image = base64.b64encode(buf.getvalue()).decode('ascii')
        plt.close('all')

    return json.dumps({'stdout': stdout_text, 'error': error, 'value': value, 'image': image})
`

let enginePromise: Promise<PyodideInterface> | null = null

/** Kicks off loading Pyodide without waiting for it. The Data Analytics page
 * calls this on mount so the ~30MB of packages are already downloading by
 * the time the learner picks an exercise and clicks Run, instead of both
 * happening back-to-back on that first click. */
export function warmUpEngine(): void {
  void loadEngine()
}

/** Loads Pyodide + numpy/pandas/matplotlib once, writes the seed CSVs into
 * its virtual filesystem, and defines __run_cell. Every exercise reuses this
 * one interpreter — reloading it per run would mean re-downloading and
 * re-initializing ~30MB of packages on every "Run". */
function loadEngine(): Promise<PyodideInterface> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const pyodide = await loadPyodide({
        indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
      })
      await pyodide.loadPackage(['numpy', 'pandas', 'matplotlib'])
      pyodide.FS.mkdirTree('/data')
      for (const [path, content] of Object.entries(CSV_FILES)) {
        pyodide.FS.writeFile(path, content)
      }
      await pyodide.runPythonAsync(SETUP_CODE)
      return pyodide
    })()
  }
  return enginePromise
}

/** Runs a learner's Python cell in a fresh namespace (so one run can never
 * see another run's variables) inside the shared interpreter loaded above.
 * `checkVar` names the variable the exercise grades; `datasets` pre-loads
 * CSVs into named DataFrames before the code runs, the same way SQL
 * Practice questions get their tables pre-loaded rather than asking the
 * learner to CREATE TABLE first. */
export async function runPython(
  code: string,
  options: { checkVar?: string; datasets?: DatasetBinding[] } = {},
): Promise<PythonRunResult> {
  const pyodide = await loadEngine()
  pyodide.globals.set('__code', code)
  pyodide.globals.set('__check_var', options.checkVar ?? '')
  pyodide.globals.set('__datasets_json', JSON.stringify(options.datasets ?? []))
  const resultJson = (await pyodide.runPythonAsync(
    '__run_cell(__code, __check_var, __datasets_json)',
  )) as string
  return JSON.parse(resultJson) as PythonRunResult
}
