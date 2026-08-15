// Phase 8: RPG-style career progression. Turns the existing three tracks
// into an XP/Level system without requiring any new content to be
// authored — XP is derived from Difficulty (SqlQuestion/DataAnalyticsExercise,
// already shared by both tracks) and ProjectLevel (AiProject), both of
// which already exist in shared/types.ts.
import type { Difficulty, ProjectLevel } from '../types.js'

/** One XP value per Difficulty tier, shared by SQL Practice and Data
 * Analytics — both use the same four-tier scale and roughly comparable
 * effort at each tier, so one table covers both tracks. */
export const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  Easy: 10,
  Medium: 20,
  Hard: 35,
  Interview: 60,
}

/** XP awarded once an AI Project reaches 'done'. Not awarded for
 * 'in-progress' — XP marks completed work; see unlockedSkills below for how
 * 'in-progress' is still recognized (as a skill introduced, not mastered). */
export const XP_BY_PROJECT_LEVEL: Record<ProjectLevel, number> = {
  Beginner: 30,
  Intermediate: 60,
  Advanced: 120,
  Portfolio: 250,
}

// --- Phase 3 (Gamification): Quizzes & Mini Challenges ---
/** Flat XP for a passing Quiz attempt (>= 75% correct) — a quick concept
 * check, so worth less than actually solving a question. */
export const XP_PER_QUIZ_PASS = 15
/** Flat XP for a successful (correct + within time) Mini Challenge —
 * more than a plain solve, since it's the same question under a clock. */
export const XP_PER_MINI_CHALLENGE = 25

// --- Phase 4 (Gamification): Boss Challenges ---
/** Flat XP for defeating a World's Boss Challenge (all parts solved) — the
 * single biggest per-world reward, since it's the hardest, multi-part
 * capstone for that world. */
export const XP_PER_BOSS_CHALLENGE = 50

export interface LevelDef {
  level: number
  title: string
  /** Total XP required to *reach* this level (cumulative, not per-level). */
  minXp: number
}

// LEVEL 0 -> LEVEL 10: a learner starts at Beginner and works up to
// "Job-Ready AI Engineer." Thresholds are spaced so clearing every
// Easy/Medium question across SQL Practice + Data Analytics gets a learner
// partway there on its own — later levels increasingly need Hard/Interview
// questions and completed AI Projects, not just volume. Checked against the
// content that exists today (shared/data/*.ts): finishing everything caps
// out around 3500 XP, comfortably above the Level 10 threshold, so Level 10
// is reachable without requiring literally every project to be 'done'.
export const LEVELS: LevelDef[] = [
  { level: 0, title: 'Beginner', minXp: 0 },
  { level: 1, title: 'Query Cadet', minXp: 60 },
  { level: 2, title: 'Data Wrangler', minXp: 150 },
  { level: 3, title: 'Pattern Seeker', minXp: 300 },
  { level: 4, title: 'Insight Analyst', minXp: 500 },
  { level: 5, title: 'Model Apprentice', minXp: 750 },
  { level: 6, title: 'Pipeline Builder', minXp: 1050 },
  { level: 7, title: 'AI Engineer in Training', minXp: 1400 },
  { level: 8, title: 'Systems Architect', minXp: 1800 },
  { level: 9, title: 'Senior AI Engineer', minXp: 2300 },
  { level: 10, title: 'Job-Ready AI Engineer', minXp: 2900 },
]

export interface LevelProgress {
  totalXp: number
  level: number
  levelTitle: string
  /** XP earned past the current level's own threshold. */
  xpIntoLevel: number
  /** XP still needed to reach the next level; null once at max level. */
  xpToNextLevel: number | null
  /** 0-1 fraction of the way to the next level (1 once at max level). */
  progressFraction: number
}

/** Pure function: total XP -> current level + progress toward the next one.
 * The one place the XP curve is evaluated, so the server (today) and any
 * future client-side optimistic UI both read the same thresholds. */
export function computeLevelProgress(totalXp: number): LevelProgress {
  let current = LEVELS[0]
  for (const def of LEVELS) {
    if (totalXp >= def.minXp) current = def
    else break
  }
  const next = LEVELS.find((def) => def.level === current.level + 1)
  const xpIntoLevel = totalXp - current.minXp
  const xpToNextLevel = next ? next.minXp - totalXp : null
  const progressFraction = next ? Math.min(1, xpIntoLevel / (next.minXp - current.minXp)) : 1

  return {
    totalXp,
    level: current.level,
    levelTitle: current.title,
    xpIntoLevel,
    xpToNextLevel,
    progressFraction,
  }
}
