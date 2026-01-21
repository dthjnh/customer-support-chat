-- AlterTable
ALTER TABLE "DirectMessage" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'text';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'text';
