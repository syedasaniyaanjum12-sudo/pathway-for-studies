// Shared by the client's in-browser sql.js engine (client/src/lib/sqlEngine.ts,
// all difficulties) and the server's independent re-grading engine
// (server/src/lib/sqlEngine.ts, Interview-tier only). Both environments
// initialize sql.js differently (browser fetch vs Node fs), but the actual
// "run this SQL against this database" logic must stay identical between
// them, or the two could disagree about what counts as a correct answer.
//
// Minimal structural types for sql.js's Database/Statement, declared here
// instead of importing sql.js itself, so this file has zero dependencies —
// any object with these methods (e.g. a real sql.js Database) satisfies it.
export interface SqlDatabaseLike {
  run(sql: string): unknown
  prepare(sql: string): SqlStatementLike
}
export interface SqlStatementLike {
  getColumnNames(): string[]
  step(): boolean
  get(): unknown[]
  free(): void
}

export interface TabularQueryResult {
  columns: string[]
  rows: unknown[][]
}

/** Splits on statement-terminating semicolons, ignoring ones inside quoted
 * string literals (e.g. a WHERE status = 'a;b' clause). Good enough for a
 * learning sandbox — not a full SQL parser. */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let quote: string | null = null
  for (const char of sql) {
    if (quote) {
      current += char
      if (char === quote) quote = null
    } else if (char === "'" || char === '"') {
      quote = char
      current += char
    } else if (char === ';') {
      if (current.trim()) statements.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) statements.push(current.trim())
  return statements
}

/** Runs `sql` (which may be multiple statements, e.g. a CREATE VIEW followed
 * by a SELECT) against `db` and returns the final statement's result. Uses
 * prepare()/step() rather than db.exec() for that final statement because
 * exec() silently omits the result set for a SELECT that legitimately
 * returns zero rows — which would otherwise misreport a correct "no
 * matching rows" answer as an error. Does not create or close `db` — the
 * caller owns that lifecycle (a fresh in-memory database per call is what
 * keeps grading runs isolated from each other). */
export function execFinalStatement(db: SqlDatabaseLike, sql: string): TabularQueryResult {
  const statements = splitSqlStatements(sql)
  if (statements.length === 0) {
    throw new Error('Write a query first.')
  }

  for (const statement of statements.slice(0, -1)) {
    db.run(statement)
  }

  const finalStatement = db.prepare(statements[statements.length - 1])
  try {
    const columns = finalStatement.getColumnNames()
    if (columns.length === 0) {
      throw new Error('The final statement must be a SELECT that returns columns.')
    }
    const rows: unknown[][] = []
    while (finalStatement.step()) {
      rows.push(finalStatement.get())
    }
    return { columns, rows }
  } finally {
    finalStatement.free()
  }
}
