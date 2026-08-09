export interface TabularResult {
  columns: string[]
  rows: unknown[][]
}

// Renders any (columns, rows) pair as a plain table. Used for raw SQL
// results and, via PythonResultView, for pandas DataFrames/Series too — a
// table is a table regardless of which engine produced it.
function ResultTable({ columns, rows }: TabularResult) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Query ran successfully — 0 rows returned.</p>
  }

  return (
    <div className="max-h-72 overflow-auto rounded-md border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-slate-100">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-medium text-slate-700">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            // Row values aren't guaranteed unique, and rows never reorder
            // within a single result, so index is a safe key here.
            <tr key={rowIndex} className="border-t border-slate-200">
              {row.map((value, columnIndex) => (
                <td key={columnIndex} className="px-3 py-2 text-slate-600">
                  {value === null ? <em className="text-slate-400">NULL</em> : String(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ResultTable
