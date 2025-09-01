/*
  Warnings:

  - Added the required column `updatedAt` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Group" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE INDEX "Group_createdById_idx" ON "public"."Group"("createdById");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "public"."GroupMember"("userId");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_idx" ON "public"."GroupMember"("groupId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "public"."Session"("expires");

-- CreateIndex
CREATE INDEX "VerificationToken_expires_idx" ON "public"."VerificationToken"("expires");
