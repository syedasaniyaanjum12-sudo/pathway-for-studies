import ResultTable from '../ResultTable/ResultTable'

interface DataFrameValue {
  __type__: 'dataframe'
  index: string[]
  columns: string[]
  rows: unknown[][]
}

interface SeriesValue {
  __type__: 'series'
  name: string | null
  index: string[]
  values: unknown[]
}

function isDataFrame(value: unknown): value is DataFrameValue {
  return isPlainObject(value) && value.__type__ === 'dataframe'
}

function isSeries(value: unknown): value is SeriesValue {
  return isPlainObject(value) && value.__type__ === 'series'
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Renders whatever pythonEngine.ts's _to_jsonable produced: a DataFrame or
// Series (via the same ResultTable used for SQL results — a table is a
// table), a plain array, or a scalar. One component instead of a per-type
// branch scattered through the page.
function PythonResultView({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <p className="text-sm text-slate-500">No result value.</p>
  }

  if (isDataFrame(value)) {
    return <ResultTable columns={value.columns} rows={value.rows} />
  }

  if (isSeries(value)) {
    return (
      <ResultTable
        columns={['index', value.name ?? 'value']}
        rows={value.index.map((index, i) => [index, value.values[i]])}
      />
    )
  }

  if (Array.isArray(value)) {
    return <ResultTable columns={['value']} rows={value.map((v) => [v]) as never} />
  }

  return <p className="font-mono text-sm text-slate-700">{String(value)}</p>
}

export default PythonResultView
