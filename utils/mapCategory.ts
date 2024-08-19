import { Category } from "@prisma/client";
import { CreateExpense } from "../pages/api/upload";

const mapCategory = (categories: Category[], expenses: CreateExpense[]) => {
  expenses.forEach((expense) => {
    categories.forEach((category) => {
      if (Array.isArray(category.keyword) && category.keyword.length > 0) {
        category.keyword?.forEach((keyword) => {
          if (expense.description.toLowerCase().includes(keyword as string) && keyword) {
            expense.categoryId = category.id;
            expense.categoryName = category.title;
          }
        });
      }
    });
  });
};

export default mapCategory;
