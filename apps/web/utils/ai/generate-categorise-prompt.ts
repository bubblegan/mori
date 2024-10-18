type CategorizableExpense = {
  description: string;
  id: number | undefined;
};

type CategoryMap = {
  title: string;
  keyword: string[];
};

export function generateCategorisePrompt(
  expenses: CategorizableExpense[],
  categories: CategoryMap[]
) {
  let keywordPrompt = "";
  const categoriesLine = categories.map((cat) => {
    const keywords = cat.keyword.join(", ");
    if (keywords.length > 0) {
      keywordPrompt += `if the expense description contain any of keyword {${keywords}} , please categorise as ${cat.title}. \n`;
    }

    return cat.title;
  });

  const categoryOptionPrompt = categoriesLine.join(",");
  let prompt = "";

  prompt +=
    " Help me categorise the following expenses with the format of {expenseId},{expense} into the format of {expenseId},{expense},{category} . Without the line numbering.  \n";
  prompt += `The category should be one of these options: ${categoryOptionPrompt} \n`;
  prompt += keywordPrompt;
  prompt += "This is example of output: \n";
  prompt += "5, Nespresso ION Singapore SG, food \n";
  prompt += "Here are the expenses need to be categorise: \n";

  expenses.forEach((expense) => {
    prompt += expense.id + "," + expense.description + "\n";
  });

  return prompt;
}
