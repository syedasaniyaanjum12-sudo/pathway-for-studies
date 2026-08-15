-- CreateTable
CREATE TABLE "BossChallenge" (
    "id" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "introText" TEXT NOT NULL,
    "parts" JSONB NOT NULL,

    CONSTRAINT "BossChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BossChallengeAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "defeated" BOOLEAN NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BossChallengeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BossChallengeAttempt_userId_challengeId_idx" ON "BossChallengeAttempt"("userId", "challengeId");

-- AddForeignKey
ALTER TABLE "BossChallengeAttempt" ADD CONSTRAINT "BossChallengeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BossChallengeAttempt" ADD CONSTRAINT "BossChallengeAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "BossChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
