-- DropIndex
DROP INDEX "PhoneOtp_expiresAt_idx";

-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "linkedEventId" TEXT,
ADD COLUMN     "requiresTicket" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "ticketInstanceId" TEXT;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_ticketInstanceId_fkey" FOREIGN KEY ("ticketInstanceId") REFERENCES "TicketInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
