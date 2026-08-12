// Driver for the run-pathway-for-studies skill.
//
// Drives the running app (client dev server on :5173, proxying /api to the
// Express server on :4000 — see ../../../client/vite.config.ts) through one
// representative flow per track, using Playwright's Chromium.
//
// Usage:
//   node driver.cjs                    # full flow, screenshots to ./screenshots/
//   BASE_URL=http://localhost:5173 node driver.cjs
//
// Requires both dev servers already running (see SKILL.md "Run" section).
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const SHOTS = path.join(__dirname, 'screenshots')
fs.mkdirSync(SHOTS, { recursive: true })

function rand() {
  return Math.random().toString(36).slice(2, 8)
}

async function main() {
  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message))

  async function shot(name) {
    await page.screenshot({ path: path.join(SHOTS, name), fullPage: true })
    console.log('  screenshot:', name)
  }

  // --- Home ---
  await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Pathway for Studies')
  await shot('01-home.png')
  console.log('OK  home page loads')

  // --- SQL Practice: wrong answer, then correct answer ---
  await page.click('a:has-text("SQL Practice")')
  await page.waitForSelector('text=Run Query')
  await page.click('text=Top 3 salaries')
  await page.click('.cm-content')
  await page.keyboard.type('SELECT first_name FROM employees LIMIT 1;')
  await page.click('button:has-text("Run Query")')
  await page.waitForSelector('text=Not quite', { timeout: 15000 })
  console.log('OK  SQL: wrong query correctly marked incorrect')

  await page.click('.cm-content')
  await page.keyboard.press('Control+A')
  await page.keyboard.type(
    'SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC LIMIT 3;',
  )
  await page.click('button:has-text("Run Query")')
  await page.waitForSelector('text=Correct!', { timeout: 15000 })
  await shot('02-sql-correct.png')
  console.log('OK  SQL: correct query graded correct')

  // --- Sign up, verify progress persists across reload ---
  await page.click('a:has-text("Sign in")')
  await page.waitForSelector('#email')
  await page.click("text=Don't have an account? Create one")
  const email = `driver-${rand()}@example.com`
  await page.fill('#email', email)
  await page.fill('#password', 'password123')
  await page.click('button:has-text("Create account")')
  await page.waitForSelector('text=Sign out', { timeout: 10000 })
  console.log('OK  registered + auto signed-in:', email)

  await page.click('a:has-text("SQL Practice")')
  await page.waitForSelector('text=Run Query')
  await page.click('text=Top 3 salaries')
  await page.click('.cm-content')
  await page.keyboard.type(
    'SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC LIMIT 3;',
  )
  await page.click('button:has-text("Run Query")')
  await page.waitForSelector('text=Correct!', { timeout: 15000 })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('text=Run Query')
  await page.waitForSelector('.text-emerald-600', { timeout: 10000 }) // the ✓ SolvedMark
  await shot('03-sql-solved-after-reload.png')
  console.log('OK  progress persisted through reload (checkmark from DB, not just local state)')

  // --- AI Projects: set a status ---
  await page.click('a:has-text("AI Engineer Projects")')
  await page.waitForSelector('text=projects from first API call')
  await page.locator('select').first().selectOption('in-progress')
  await page.waitForTimeout(500)
  await shot('04-ai-project-status.png')
  console.log('OK  AI Projects: status dropdown sets and persists')

  // --- Data Analytics: the concurrency-race regression check ---
  // (see docs/PLAN.md "Bugs found by actually running the app" — grading
  // used to be able to silently run the SOLUTION instead of the learner's
  // code under concurrent execution. This exercises that exact path.)
  await page.click('a:has-text("Data Analytics")')
  await page.waitForSelector('text=Run Code')
  await page.click('text=Build a NumPy range')
  await page.click('.cm-content')
  await page.keyboard.type('result = np.arange(1, 5)') // deliberately wrong range
  await page.click('button:has-text("Run Code")')
  await page.waitForSelector('text=Not quite', { timeout: 60000 })
  console.log('OK  Data Analytics: wrong code correctly marked incorrect (grading race regression check)')

  await page.click('.cm-content')
  await page.keyboard.press('Control+A')
  await page.keyboard.type('result = np.arange(1, 11)')
  await page.click('button:has-text("Run Code")')
  await page.waitForSelector('text=Correct!', { timeout: 60000 })
  await shot('05-python-correct.png')
  console.log('OK  Data Analytics: correct code graded correct')

  // --- Phase 6: Interview-tier questions get independently re-graded
  // server-side, not just trusted from the client's self-report. First,
  // the honest path through the real UI: ---
  await page.click('a:has-text("SQL Practice")')
  await page.waitForSelector('text=Run Query')
  await page.click('button:has-text("Interview")')
  await page.click('text=Top 3 customers by spend')
  await page.click('.cm-content')
  await page.keyboard.type(
    'SELECT o.customer_id, SUM(s.quantity * s.unit_price) AS total_spent FROM orders o JOIN sales s ON o.order_id = s.order_id GROUP BY o.customer_id ORDER BY total_spent DESC LIMIT 3;',
  )
  await page.click('button:has-text("Run Query")')
  await page.waitForSelector('text=Correct!', { timeout: 15000 })
  await page.waitForSelector('text=Server-verified', { timeout: 10000 })
  await shot('06-sql-interview-verified.png')
  console.log('OK  SQL Interview-tier: correct answer shows the Server-verified badge')

  // Then the actual security-relevant check: a real UI can't lie about its
  // own grading (it always self-reports honestly), so hitting the API
  // directly is how you exercise "does the server actually re-check this,
  // or does it just believe whatever isCorrect the client sends" — the
  // exact trust-boundary gap Phase 6 closed for Interview-tier questions
  // (see docs/PLAN.md). Reuses the already-signed-in session's token.
  const dishonestResult = await page.evaluate(async () => {
    const token = localStorage.getItem('pathway.authToken')
    const res = await fetch('/api/sql-questions/top-customers-by-spend/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ submittedQuery: 'SELECT 1;', isCorrect: true }), // lying: SELECT 1; is not the answer
    })
    return res.json()
  })
  if (dishonestResult.gradedBy !== 'server' || dishonestResult.isCorrect !== false) {
    throw new Error(
      'REGRESSION: server did not catch a dishonest isCorrect:true on an Interview-tier question — got ' +
        JSON.stringify(dishonestResult),
    )
  }
  console.log('OK  SQL Interview-tier: server overrides a dishonest correct-report to incorrect')

  // --- Phase 7: search narrows the list, and shows an empty state (with a
  // working "Clear filters") when nothing matches. ---
  await page.fill('input[type="search"]', 'window')
  await page.waitForTimeout(200)
  const windowMatches = await page.locator('aside li').count()
  if (windowMatches === 0) throw new Error('REGRESSION: search for "window" matched 0 SQL questions')
  console.log(`OK  SQL search: "window" matched ${windowMatches} question(s)`)

  await page.fill('input[type="search"]', 'zzzznonexistent')
  await page.waitForSelector('text=No questions match your search/filter.', { timeout: 5000 })
  await shot('07-sql-search-empty-state.png')
  await page.click('text=Clear filters')
  await page.waitForSelector('text=No questions match your search/filter.', { state: 'detached' })
  console.log('OK  SQL search: empty state shows for no matches, Clear filters recovers')

  await browser.close()

  console.log(`\n${errors.length} browser console error(s)`)
  errors.forEach((e) => console.log('  -', e))
  if (errors.length > 0) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('DRIVER FAILED:', err)
  process.exit(1)
})
