import initSqlJs, { type Database, type SqlValue } from 'sql.js'
// Shared with the future Data Analytics track (Phase 3) — kept at the repo
// root instead of duplicated inside client/src. See vite.config.ts for the
// server.fs.allow setting this import relies on.
import seedSql from '../../../datasets/seed.sql?raw'
import { execFinalStatement, type TabularQueryResult } from '../../../shared/sqlExec'

export type QueryResult = TabularQueryResult & { rows: SqlValue[][] }

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

/** Runs `sql` against a fresh database and returns the final statement's
 * result. See shared/sqlExec.ts for the actual execution logic — kept there
 * so the server's independent re-grading engine (Phase 6, Interview-tier
 * questions) can never silently diverge from this one. */
export async function runQuery(sql: string): Promise<QueryResult> {
  const db = await createDatabase()
  try {
    return execFinalStatement(db, sql) as QueryResult
  } finally {
    db.close()
  }
}
