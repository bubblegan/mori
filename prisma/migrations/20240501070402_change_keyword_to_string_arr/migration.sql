/*
  Warnings:

  - The `keyword` column on the `Category` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "keyword",
ADD COLUMN     "keyword" TEXT[] DEFAULT ARRAY[]::TEXT[];
