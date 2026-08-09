-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SqlSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "submittedQuery" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SqlSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SqlSubmission_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SqlQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataAnalyticsSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "submittedCode" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DataAnalyticsSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DataAnalyticsSubmission_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "DataAnalyticsExercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserProjectStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not-started',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProjectStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserProjectStatus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AiProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SqlSubmission_userId_questionId_idx" ON "SqlSubmission"("userId", "questionId");

-- CreateIndex
CREATE INDEX "DataAnalyticsSubmission_userId_exerciseId_idx" ON "DataAnalyticsSubmission"("userId", "exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProjectStatus_userId_projectId_key" ON "UserProjectStatus"("userId", "projectId");
