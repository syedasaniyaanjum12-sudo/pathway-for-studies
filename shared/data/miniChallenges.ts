// Phase 3 (Gamification): one timed Mini Challenge per practicable
// (SQL/Data Analytics) World — a MiniChallenge's `id` IS its WorldDef.id
// (1:1), matching the same convention as shared/data/quizzes.ts. Each just
// wraps an *existing* SqlQuestion/DataAnalyticsExercise (by id) with a time
// limit — grading stays exactly the question's own (sql.js/Pyodide), this
// only adds a clock. AI Projects worlds have no Mini Challenge: there's no
// single gradable artifact to time the way there is for a question/exercise.
import type { MiniChallenge } from '../types.js'

export const miniChallenges: MiniChallenge[] = [
  {
    id: 'sql-foundations',
    track: 'sql',
    refId: 'filter-expensive-products',
    timeLimitSeconds: 60,
    flavorText: 'Race the clock — filter the products table before time runs out!',
  },
  {
    id: 'sql-aggregates-joins',
    track: 'sql',
    refId: 'count-completed-orders',
    timeLimitSeconds: 60,
    flavorText: 'One clean aggregate query, against the clock.',
  },
  {
    id: 'da-numpy-pandas',
    track: 'data-analytics',
    refId: 'numpy-basic-array',
    timeLimitSeconds: 60,
    flavorText: 'A quick NumPy array build, timed.',
  },
  {
    id: 'sql-patterns',
    track: 'sql',
    refId: 'case-seniority',
    timeLimitSeconds: 90,
    flavorText: 'CASE WHEN logic under a countdown — no pressure.',
  },
  {
    id: 'da-cleaning',
    track: 'data-analytics',
    refId: 'cleaning-strip-whitespace',
    timeLimitSeconds: 90,
    flavorText: 'Clean the data before the timer beats you to it.',
  },
  {
    id: 'da-eda-viz',
    track: 'data-analytics',
    refId: 'eda-value-counts',
    timeLimitSeconds: 90,
    flavorText: 'A fast categorical breakdown, timed.',
  },
  {
    id: 'sql-advanced',
    track: 'sql',
    refId: 'window-salary-rank',
    timeLimitSeconds: 180,
    flavorText: "A real window function, against the clock — this one's earned.",
  },
]
