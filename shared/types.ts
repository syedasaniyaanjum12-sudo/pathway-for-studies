// Types shared between client and server. Both the Express API (via Prisma)
// and the React app import these instead of each defining their own copy —
// the whole point of this package existing once a real backend does.

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Interview'

export interface SqlQuestion {
  id: string
  title: string
  difficulty: Difficulty
  topic: string
  prompt: string
  solutionQuery: string
  /** True when row order is part of a correct answer (e.g. the query itself
   * requires ORDER BY/LIMIT). Otherwise results are compared as sets. */
  orderMatters?: boolean
  hint: string
}

export interface DatasetBinding {
  /** Python variable name the CSV should be loaded into, e.g. 'employees_df'. */
  variable: string
  /** Path on the Pyodide virtual filesystem, e.g. '/data/employees.csv'. */
  file: string
}

export interface DataAnalyticsExercise {
  id: string
  title: string
  difficulty: Difficulty
  topic: string
  prompt: string
  datasets: DatasetBinding[]
  solutionCode: string
  hint: string
  /** True when the point of the exercise is a chart — the UI renders the
   * plot alongside the verdict. Grading still uses `result` either way. */
  expectsPlot?: boolean
}

export type ProjectLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Portfolio'

export interface AiProject {
  id: string
  title: string
  level: ProjectLevel
  description: string
  techStack: string[]
  skills: string[]
}
