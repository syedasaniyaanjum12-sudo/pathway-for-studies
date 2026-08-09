import type { QueryResult } from './sqlEngine'

/** Compares a submitted result to the expected one. Column *names* aren't
 * checked — only column count and row data — so learners aren't penalized
 * for choosing a different (but reasonable) alias than the solution uses.
 * When `orderMatters` is false, rows are compared as a multiset since plain
 * SELECT/JOIN/GROUP BY results have no guaranteed order in SQL. */
export function resultsMatch(
  actual: QueryResult,
  expected: QueryResult,
  orderMatters: boolean,
): boolean {
  if (actual.columns.length !== expected.columns.length) return false
  if (actual.rows.length !== expected.rows.length) return false

  if (orderMatters) {
    return rowsEqualInOrder(actual.rows, expected.rows)
  }
  return rowsEqualAsSet(actual.rows, expected.rows)
}

function rowsEqualInOrder(a: QueryResult['rows'], b: QueryResult['rows']): boolean {
  return a.every((row, i) => JSON.stringify(row) === JSON.stringify(b[i]))
}

function rowsEqualAsSet(a: QueryResult['rows'], b: QueryResult['rows']): boolean {
  const normalize = (rows: QueryResult['rows']) => rows.map((row) => JSON.stringify(row)).sort()
  const sortedA = normalize(a)
  const sortedB = normalize(b)
  return sortedA.every((row, i) => row === sortedB[i])
}
