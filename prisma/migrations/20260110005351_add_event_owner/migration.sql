/*
  Warnings:

  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "events";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "organizerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_polls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'POLL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creatorId" TEXT NOT NULL,
    "eventId" TEXT,
    CONSTRAINT "polls_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "polls_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_polls" ("createdAt", "creatorId", "description", "endDate", "eventId", "id", "isFeatured", "status", "title", "type", "updatedAt") SELECT "createdAt", "creatorId", "description", "endDate", "eventId", "id", "isFeatured", "status", "title", "type", "updatedAt" FROM "polls";
DROP TABLE "polls";
ALTER TABLE "new_polls" RENAME TO "polls";
CREATE TABLE "new_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tickets" ("eventId", "id", "price", "quantity", "type", "userId") SELECT "eventId", "id", "price", "quantity", "type", "userId" FROM "tickets";
DROP TABLE "tickets";
ALTER TABLE "new_tickets" RENAME TO "tickets";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");

-- CreateIndex
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");
