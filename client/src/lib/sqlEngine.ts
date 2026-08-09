import initSqlJs, { type Database, type SqlValue } from 'sql.js'
// Shared with the future Data Analytics track (Phase 3) — kept at the repo
// root instead of duplicated inside client/src. See vite.config.ts for the
// server.fs.allow setting this import relies on.
import seedSql from '../../../datasets/seed.sql?raw'

export interface QueryResult {
  columns: string[]
  rows: SqlValue[][]
}

let sqlJsPromise: ReturnType<typeof initSqlJs> | null = null

/** Loads the sql.js WASM runtime once and reuses it for every database. */
function loadSqlJs() {
  if (!sqlJsPromise) {
    // Vite resolves sql.js's package.json "browser" field, which loads
    // sql-wasm-browser.js — that file requests sql-wasm-browser.wasm (NOT
    // sql-wasm.wasm, the "main"-field build's file — they're byte-identical,
    // just named differently). That's the file copied into client/public/.
    sqlJsPromise = initSqlJs({ locateFile: (file) => `/${file}` })
  }
  return sqlJsPromise
}

/** Creates a fresh in-memory database pre-loaded with the sample schema and
 * data. Called once per query run (see runQuery) so every attempt — and the
 * solution query used to grade it — starts from identical, isolated state. */
export async function createDatabase(): Promise<Database> {
  const SQL = await loadSqlJs()
  const db = new SQL.Database()
  db.run(seedSql)
  return db
}

/** Splits on statement-terminating semicolons, ignoring ones inside quoted
 * string literals (e.g. a WHERE status = 'a;b' clause). Good enough for a
 * learning sandbox — not a full SQL parser. */
function splitStatements(sql: string): string[] {
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
 * by a SELECT) against a fresh database and returns the final statement's
 * result. Uses prepare()/step() rather than db.exec() for that final
 * statement because exec() silently omits the result set for a SELECT that
 * legitimately returns zero rows — which would otherwise misreport a
 * correct "no matching rows" answer as an error. */
export async function runQuery(sql: string): Promise<QueryResult> {
  const db = await createDatabase()
  try {
    const statements = splitStatements(sql)
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
      const rows: SqlValue[][] = []
      while (finalStatement.step()) {
        rows.push(finalStatement.get())
      }
      return { columns, rows }
    } finally {
      finalStatement.free()
    }
  } finally {
    db.close()
  }
}
