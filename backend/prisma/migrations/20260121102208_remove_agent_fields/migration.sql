/*
  Warnings:

  - The values [AGENT] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `agentId` on the `ChatRoom` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('CUSTOMER', 'ADMIN');
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_agentId_fkey";

-- AlterTable
ALTER TABLE "ChatRoom" DROP COLUMN "agentId";
