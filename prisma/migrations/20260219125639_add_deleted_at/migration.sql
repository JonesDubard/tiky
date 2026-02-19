-- AlterTable
ALTER TABLE "Event" ADD COLUMN "deletedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT,
    "deviceId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Vote" ("createdAt", "deviceId", "id", "optionId", "pollId", "userId") SELECT "createdAt", "deviceId", "id", "optionId", "pollId", "userId" FROM "Vote";
DROP TABLE "Vote";
ALTER TABLE "new_Vote" RENAME TO "Vote";
CREATE INDEX "Vote_pollId_idx" ON "Vote"("pollId");
CREATE INDEX "Vote_optionId_idx" ON "Vote"("optionId");
CREATE INDEX "Vote_deviceId_idx" ON "Vote"("deviceId");
CREATE UNIQUE INDEX "Vote_pollId_userId_key" ON "Vote"("pollId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
