/*
  Warnings:

  - Added the required column `orderId` to the `TicketReservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `TicketReservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TicketInstance" ADD COLUMN "pdfUrl" TEXT;
ALTER TABLE "TicketInstance" ADD COLUMN "qrImage" TEXT;
ALTER TABLE "TicketInstance" ADD COLUMN "scannedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalPrice" REAL NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ticketGenerated" BOOLEAN NOT NULL DEFAULT false,
    "pdfUrl" TEXT,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "id", "status", "totalPrice", "updatedAt", "userId") SELECT "createdAt", "id", "status", "totalPrice", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE TABLE "new_TicketReservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketTypeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "TicketReservation_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicketReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicketReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TicketReservation" ("createdAt", "expiresAt", "id", "ticketTypeId", "userId") SELECT "createdAt", "expiresAt", "id", "ticketTypeId", "userId" FROM "TicketReservation";
DROP TABLE "TicketReservation";
ALTER TABLE "new_TicketReservation" RENAME TO "TicketReservation";
CREATE INDEX "TicketReservation_orderId_idx" ON "TicketReservation"("orderId");
CREATE INDEX "TicketReservation_ticketTypeId_idx" ON "TicketReservation"("ticketTypeId");
CREATE INDEX "TicketReservation_expiresAt_idx" ON "TicketReservation"("expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TicketInstance_orderId_idx" ON "TicketInstance"("orderId");
