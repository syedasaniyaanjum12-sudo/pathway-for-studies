import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  XP_BY_DIFFICULTY,
  XP_BY_PROJECT_LEVEL,
  XP_PER_QUIZ_PASS,
  XP_PER_MINI_CHALLENGE,
  XP_PER_BOSS_CHALLENGE,
  computeLevelProgress,
} from '../../../shared/data/levels.js'
import type { Difficulty, ProjectLevel } from '../../../shared/types.js'

export const progressRouter = Router()

// One summary endpoint the client calls once per page load, rather than
// three separate "am I done with this?" queries per item — the UI needs
// this before it can render checkmarks in the SQL/exercise/project lists.
//
// Phase 8 extended this same endpoint with XP/level/skills rather than
// adding a second one: XP is a pure function of the exact same
// solved-questions/exercises/projects data already being fetched here, so
// computing it alongside costs one extra `select` per query, not a new
// round trip.
progressRouter.get('/', requireAuth, async (req, res) => {
  const userId = req.userId!

  const [sqlSolved, exercisesSolved, projectStatuses, quizzesPassed, miniChallengesCompleted, bossChallengesDefeated] =
    await Promise.all([
      prisma.sqlSubmission.findMany({
        where: { userId, isCorrect: true },
        distinct: ['questionId'],
        select: { questionId: true, question: { select: { difficulty: true, topic: true } } },
      }),
      prisma.dataAnalyticsSubmission.findMany({
        where: { userId, isCorrect: true },
        distinct: ['exerciseId'],
        select: { exerciseId: true, exercise: { select: { difficulty: true, topic: true } } },
      }),
      prisma.userProjectStatus.findMany({
        where: { userId },
        select: { projectId: true, status: true, project: { select: { level: true, skills: true } } },
      }),
      // Phase 3 (Gamification): a quiz counts as "passed" if any attempt
      // ever passed — same append-only-log philosophy as solved
      // questions/exercises above, not a separately mutable flag.
      prisma.quizAttempt.findMany({
        where: { userId, passed: true },
        distinct: ['quizId'],
        select: { quizId: true },
      }),
      prisma.miniChallengeAttempt.findMany({
        where: { userId, succeeded: true },
        distinct: ['challengeId'],
        select: { challengeId: true },
      }),
      // Phase 4 (Gamification): same append-only-log philosophy — "defeated"
      // if any attempt ever fully cleared it.
      prisma.bossChallengeAttempt.findMany({
        where: { userId, defeated: true },
        distinct: ['challengeId'],
        select: { challengeId: true },
      }),
    ])

  // XP: Difficulty-based for solved questions/exercises, ProjectLevel-based
  // for 'done' projects only (an 'in-progress' project hasn't been
  // completed yet, so it earns no XP — see unlockedSkills below for how
  // it's still recognized).
  const sqlXp = sqlSolved.reduce(
    (sum, s) => sum + XP_BY_DIFFICULTY[s.question.difficulty as Difficulty],
    0,
  )
  const exerciseXp = exercisesSolved.reduce(
    (sum, e) => sum + XP_BY_DIFFICULTY[e.exercise.difficulty as Difficulty],
    0,
  )
  const projectXp = projectStatuses
    .filter((p) => p.status === 'done')
    .reduce((sum, p) => sum + XP_BY_PROJECT_LEVEL[p.project.level as ProjectLevel], 0)
  const quizXp = quizzesPassed.length * XP_PER_QUIZ_PASS
  const miniChallengeXp = miniChallengesCompleted.length * XP_PER_MINI_CHALLENGE
  const bossChallengeXp = bossChallengesDefeated.length * XP_PER_BOSS_CHALLENGE

  const levelProgress = computeLevelProgress(
    sqlXp + exerciseXp + projectXp + quizXp + miniChallengeXp + bossChallengeXp,
  )

  // "Skills unlocked": topics touched by solved questions/exercises, plus
  // the skills[] of any AI Project that's at least 'in-progress' — a skill
  // starts developing before a project is finished, unlike XP which only
  // rewards completion.
  const unlockedSkills = new Set<string>()
  for (const s of sqlSolved) unlockedSkills.add(s.question.topic)
  for (const e of exercisesSolved) unlockedSkills.add(e.exercise.topic)
  for (const p of projectStatuses) {
    if (p.status === 'in-progress' || p.status === 'done') {
      for (const skill of p.project.skills as string[]) unlockedSkills.add(skill)
    }
  }

  res.json({
    solvedSqlQuestionIds: sqlSolved.map((s) => s.questionId),
    solvedExerciseIds: exercisesSolved.map((e) => e.exerciseId),
    projectStatuses: Object.fromEntries(projectStatuses.map((p) => [p.projectId, p.status])),
    ...levelProgress,
    unlockedSkills: Array.from(unlockedSkills).sort(),
    passedQuizIds: quizzesPassed.map((q) => q.quizId),
    completedMiniChallengeIds: miniChallengesCompleted.map((c) => c.challengeId),
    defeatedBossChallengeIds: bossChallengesDefeated.map((c) => c.challengeId),
  })
})
