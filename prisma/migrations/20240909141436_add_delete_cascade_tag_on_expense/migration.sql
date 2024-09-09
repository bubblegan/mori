-- DropForeignKey
ALTER TABLE "TagsOnExpenses" DROP CONSTRAINT "TagsOnExpenses_expensesId_fkey";

-- DropForeignKey
ALTER TABLE "TagsOnExpenses" DROP CONSTRAINT "TagsOnExpenses_tagId_fkey";

-- AddForeignKey
ALTER TABLE "TagsOnExpenses" ADD CONSTRAINT "TagsOnExpenses_expensesId_fkey" FOREIGN KEY ("expensesId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnExpenses" ADD CONSTRAINT "TagsOnExpenses_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
