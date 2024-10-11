/*
  Warnings:

  - You are about to drop the `TempFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TempFile" DROP CONSTRAINT "TempFile_userId_fkey";

-- DropTable
DROP TABLE "TempFile";
