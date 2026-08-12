// Shared by client (grading in-browser, all difficulties) and server
// (re-grading Interview-tier submissions independently — see
// server/src/routes/sqlQuestions.ts). Keeping this in one place means the
// two can never silently disagree about what "correct" means.

export interface TabularQueryResult {
  columns: string[]
  rows: unknown[][]
}

/** Compares a submitted result to the expected one. Column *names* aren't
 * checked — only column count and row data — so learners aren't penalized
 * for choosing a different (but reasonable) alias than the solution uses.
 * When `orderMatters` is false, rows are compared as a multiset since plain
 * SELECT/JOIN/GROUP BY results have no guaranteed order in SQL. */
export function resultsMatch(
  actual: TabularQueryResult,
  expected: TabularQueryResult,
  orderMatters: boolean,
): boolean {
  if (actual.columns.length !== expected.columns.length) return false
  if (actual.rows.length !== expected.rows.length) return false

  if (orderMatters) {
    return rowsEqualInOrder(actual.rows, expected.rows)
  }
  return rowsEqualAsSet(actual.rows, expected.rows)
}

function rowsEqualInOrder(a: unknown[][], b: unknown[][]): boolean {
  return a.every((row, i) => JSON.stringify(row) === JSON.stringify(b[i]))
}

function rowsEqualAsSet(a: unknown[][], b: unknown[][]): boolean {
  const normalize = (rows: unknown[][]) => rows.map((row) => JSON.stringify(row)).sort()
  const sortedA = normalize(a)
  const sortedB = normalize(b)
  return sortedA.every((row, i) => row === sortedB[i])
}
