// Populates the database from the shared content modules (the same data the
// client used to import directly, before Phase 4). This is the "migrate
// static content into DB" step: shared/data/*.ts stays the human-edited
// source of new questions/projects/exercises, and this script is how they
// get into the database — run automatically after `prisma migrate dev`, or
// manually via `npm run prisma:seed`.
import { PrismaClient, type Prisma } from '@prisma/client'
import { sqlQuestions } from '../../shared/data/sqlQuestions.js'
import { dataAnalyticsExercises } from '../../shared/data/dataAnalyticsExercises.js'
import { aiProjects } from '../../shared/data/aiProjects.js'
import { quizzes } from '../../shared/data/quizzes.js'
import { miniChallenges } from '../../shared/data/miniChallenges.js'
import { bossChallenges } from '../../shared/data/bossChallenges.js'

const prisma = new PrismaClient()

async function main() {
  for (const q of sqlQuestions) {
    await prisma.sqlQuestion.upsert({
      where: { id: q.id },
      create: { ...q, orderMatters: q.orderMatters ?? false },
      update: { ...q, orderMatters: q.orderMatters ?? false },
    })
  }
  console.log(`Seeded ${sqlQuestions.length} SQL questions.`)

  for (const ex of dataAnalyticsExercises) {
    // DatasetBinding[] is a plain array of {variable, file} objects — valid
    // JSON — but TS's structural typing won't match Prisma's InputJsonObject
    // (which requires an index signature) without this cast.
    const datasets = ex.datasets as unknown as Prisma.InputJsonValue
    await prisma.dataAnalyticsExercise.upsert({
      where: { id: ex.id },
      create: { ...ex, expectsPlot: ex.expectsPlot ?? false, datasets },
      update: { ...ex, expectsPlot: ex.expectsPlot ?? false, datasets },
    })
  }
  console.log(`Seeded ${dataAnalyticsExercises.length} Data Analytics exercises.`)

  for (const p of aiProjects) {
    await prisma.aiProject.upsert({
      where: { id: p.id },
      create: p,
      update: p,
    })
  }
  console.log(`Seeded ${aiProjects.length} AI projects.`)

  for (const quiz of quizzes) {
    // QuizQuestion[] is a plain array of objects — valid JSON — but needs
    // the same cast as datasets/skills above for Prisma's InputJsonObject.
    const questions = quiz.questions as unknown as Prisma.InputJsonValue
    await prisma.quiz.upsert({
      where: { id: quiz.id },
      create: { id: quiz.id, title: quiz.title, questions },
      update: { title: quiz.title, questions },
    })
  }
  console.log(`Seeded ${quizzes.length} quizzes.`)

  for (const challenge of miniChallenges) {
    await prisma.miniChallenge.upsert({
      where: { id: challenge.id },
      create: challenge,
      update: challenge,
    })
  }
  console.log(`Seeded ${miniChallenges.length} mini challenges.`)

  for (const boss of bossChallenges) {
    const parts = boss.parts as unknown as Prisma.InputJsonValue
    await prisma.bossChallenge.upsert({
      where: { id: boss.id },
      create: { id: boss.id, track: boss.track, title: boss.title, introText: boss.introText, parts },
      update: { track: boss.track, title: boss.title, introText: boss.introText, parts },
    })
  }
  console.log(`Seeded ${bossChallenges.length} boss challenges.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
