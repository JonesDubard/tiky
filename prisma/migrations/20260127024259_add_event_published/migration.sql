-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "organizerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("createdAt", "createdById", "date", "description", "id", "imageUrl", "location", "organizerId", "title") SELECT "createdAt", "createdById", "date", "description", "id", "imageUrl", "location", "organizerId", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
