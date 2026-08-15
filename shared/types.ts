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

// --- Phase 5: auth + progress tracking ---

export interface AuthUser {
  id: string
  email: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export type ProjectStatus = 'not-started' | 'in-progress' | 'done'

/** Response shape of GET /api/me/progress — everything the UI needs to
 * render checkmarks/status across all three tracks in one request. */
export interface ProgressSummary {
  solvedSqlQuestionIds: string[]
  solvedExerciseIds: string[]
  projectStatuses: Record<string, ProjectStatus>

  // --- Phase 8: RPG career progression (see shared/data/levels.ts) ---
  /** Total XP earned across all three tracks, computed from solved
   * questions/exercises (by Difficulty) and 'done' AI Projects (by
   * ProjectLevel) — a pure function of the attempt history, not a
   * separately-tracked mutable counter. */
  totalXp: number
  /** Current level, 0 (Beginner) through 10 (Job-Ready AI Engineer). */
  level: number
  levelTitle: string
  /** XP earned past the current level's own threshold. */
  xpIntoLevel: number
  /** XP still needed to reach the next level; null once at max level. */
  xpToNextLevel: number | null
  /** 0-1 fraction of the way to the next level (1 once at max level). */
  progressFraction: number
  /** Topics (from solved SQL questions/exercises) and project skills (from
   * AI Projects that are 'in-progress' or 'done') the learner has touched
   * so far — shown as a "skills unlocked" list. */
  unlockedSkills: string[]

  // --- Phase 3 (Gamification): Quizzes & Mini Challenges ---
  /** Quiz ids (== World ids) with at least one passing attempt. */
  passedQuizIds: string[]
  /** MiniChallenge ids (== World ids) with at least one successful attempt. */
  completedMiniChallengeIds: string[]

  // --- Phase 4 (Gamification): Boss Challenges ---
  /** BossChallenge ids (== World ids) that have been defeated. */
  defeatedBossChallengeIds: string[]
}

// --- Phase 6: server-side re-grading for Interview-tier questions ---

/** Response shape of POST .../submissions. For Easy/Medium/Hard, the server
 * just records whatever `isCorrect` the client (which already graded the
 * attempt itself, in-browser) reported — see docs/PLAN.md's Phase 5 note on
 * that trust boundary. For Interview-tier questions/exercises, the server
 * independently re-executes the submission (sql.js on the server for SQL, a
 * RestrictedPython sandbox for Python) and `gradedBy: 'server'` reflects
 * that its own `isCorrect` is authoritative, not just relayed. `gradedBy`
 * falls back to 'client' (with `serverNote` explaining why) if server-side
 * re-grading itself couldn't run — e.g. the Python sandbox isn't installed
 * on this deployment — so an infra gap never blocks a learner from seeing a
 * result. */
export interface SubmissionResult {
  id: string
  isCorrect: boolean
  gradedBy: 'client' | 'server'
  serverNote?: string
}

// --- Phase 3 (Gamification): Quizzes & Mini Challenges ---
// See docs/PLAN.md's "Gamification plan" for the full design. Both content
// types are 1:1 with a World (shared/data/worlds.ts) — a Quiz/MiniChallenge's
// `id` IS its WorldDef.id, so the World Map can link straight to
// /quiz/<worldId> or /mini-challenge/<worldId> with no separate lookup.

export interface QuizChoice {
  id: string
  text: string
}

/** Sent to the client as-is (GET /api/quizzes), same trust model as
 * SqlQuestion.solutionQuery/DataAnalyticsExercise.solutionCode — the answer
 * key ships upfront so a quiz is gradeable (and usable) instantly and
 * client-side, including for a signed-out learner just trying it out. See
 * QuizAttemptResult for the (signed-in only) authoritative server re-grade
 * that actually persists an attempt and awards XP. */
export interface QuizQuestion {
  id: string
  prompt: string
  choices: QuizChoice[]
  correctChoiceId: string
  explanation: string
}

export interface Quiz {
  /** Matches a WorldDef.id 1:1 — one quiz per world. */
  id: string
  title: string
  questions: QuizQuestion[]
}

export interface QuizAttemptRequest {
  /** questionId -> the choiceId the learner selected. */
  choices: Record<string, string>
}

export interface QuizAttemptResult {
  id: string
  quizId: string
  correctCount: number
  totalCount: number
  /** correctCount / totalCount >= 0.75 */
  passed: boolean
  /** questionId -> whether the learner got it right, per the server's own
   * (authoritative) grading — should always agree with what the client
   * already computed itself from the same answer key, but this is what's
   * actually persisted and what earns XP. */
  review: Record<string, { correct: boolean; correctChoiceId: string; explanation: string }>
}

/** A timed variant of one existing SqlQuestion/DataAnalyticsExercise —
 * reuses that question's own grading (sql.js/Pyodide client-side, or the
 * server re-grade for Interview-tier) rather than introducing a second
 * grading path; this just adds a clock on top. */
export interface MiniChallenge {
  /** Matches a WorldDef.id 1:1 — one mini challenge per practicable
   * (SQL/Data Analytics) world; AI Projects worlds don't have one, since
   * there's no single gradable artifact to time. */
  id: string
  track: 'sql' | 'data-analytics'
  /** SqlQuestion.id (if track is 'sql') or DataAnalyticsExercise.id
   * (if track is 'data-analytics'). */
  refId: string
  timeLimitSeconds: number
  flavorText: string
}

export interface MiniChallengeAttemptRequest {
  elapsedSeconds: number
  isCorrect: boolean
}

export interface MiniChallengeAttemptResult {
  id: string
  /** isCorrect && elapsedSeconds <= timeLimitSeconds */
  succeeded: boolean
  elapsedSeconds: number
  timeLimitSeconds: number
}

// --- Phase 4 (Gamification): Boss Challenges ---
// A World's capstone: a harder, multi-part problem (2+ parts, each graded
// independently by the world's own track engine — sql.js or Pyodide) that
// must ALL be solved to "defeat the boss." Same 1:1-with-World-id
// convention as Quiz/MiniChallenge, and same scope boundary as
// MiniChallenge: only the 7 SQL/Data Analytics Worlds have one — AI
// Projects Worlds have no single gradable artifact for a boss fight either.

export interface BossChallengePart {
  id: string
  prompt: string
  hint: string
  /** Present when the parent BossChallenge's track is 'sql'. */
  solutionQuery?: string
  orderMatters?: boolean
  /** Present when the parent BossChallenge's track is 'data-analytics'. */
  solutionCode?: string
  datasets?: DatasetBinding[]
  expectsPlot?: boolean
}

export interface BossChallenge {
  /** Matches a WorldDef.id 1:1 — one Boss Challenge per practicable World. */
  id: string
  track: 'sql' | 'data-analytics'
  title: string
  /** Flavor text introducing the fight. */
  introText: string
  parts: BossChallengePart[]
}

export interface BossChallengeAttemptRequest {
  /** Ids of the parts the client graded as correct this session — the
   * server can't re-execute SQL/Python itself (no Interview-tier-style
   * sandbox for this), but it can and does check this covers every part
   * before marking the boss defeated, rather than blindly trusting a
   * single boolean. */
  correctPartIds: string[]
}

export interface BossChallengeAttemptResult {
  id: string
  /** correctCount === totalCount, i.e. every part was solved. */
  defeated: boolean
  correctCount: number
  totalCount: number
}
