-- CreateTable
CREATE TABLE "SqlQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "solutionQuery" TEXT NOT NULL,
    "orderMatters" BOOLEAN NOT NULL DEFAULT false,
    "hint" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DataAnalyticsExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "datasets" JSONB NOT NULL,
    "solutionCode" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "expectsPlot" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "AiProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "techStack" JSONB NOT NULL,
    "skills" JSONB NOT NULL
);
