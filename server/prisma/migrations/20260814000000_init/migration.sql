-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "SqlQuestion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "solutionQuery" TEXT NOT NULL,
    "orderMatters" BOOLEAN NOT NULL DEFAULT false,
    "hint" TEXT NOT NULL,

    CONSTRAINT "SqlQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataAnalyticsExercise" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "datasets" JSONB NOT NULL,
    "solutionCode" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "expectsPlot" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DataAnalyticsExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "techStack" JSONB NOT NULL,
    "skills" JSONB NOT NULL,

    CONSTRAINT "AiProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SqlSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "submittedQuery" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SqlSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataAnalyticsSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "submittedCode" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataAnalyticsSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProjectStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not-started',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProjectStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SqlSubmission_userId_questionId_idx" ON "SqlSubmission"("userId", "questionId");

-- CreateIndex
CREATE INDEX "DataAnalyticsSubmission_userId_exerciseId_idx" ON "DataAnalyticsSubmission"("userId", "exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProjectStatus_userId_projectId_key" ON "UserProjectStatus"("userId", "projectId");

-- AddForeignKey
ALTER TABLE "SqlSubmission" ADD CONSTRAINT "SqlSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SqlSubmission" ADD CONSTRAINT "SqlSubmission_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SqlQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataAnalyticsSubmission" ADD CONSTRAINT "DataAnalyticsSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataAnalyticsSubmission" ADD CONSTRAINT "DataAnalyticsSubmission_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "DataAnalyticsExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProjectStatus" ADD CONSTRAINT "UserProjectStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProjectStatus" ADD CONSTRAINT "UserProjectStatus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AiProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
