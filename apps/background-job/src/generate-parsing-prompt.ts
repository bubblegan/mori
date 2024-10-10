type CategoryMap = {
  title: string;
  keyword: string[];
};

export function generateParsingPrompt(
  statementText: string,
  categories: CategoryMap[]
) {
  let keywordPrompt = "";

  const categoriesLine = categories.map((cat) => {
    const keywords = cat.keyword.join(", ");
    if (keywords.length > 0) {
      keywordPrompt += `if the description contain any of keyword {${keywords}} , please categorise as ${cat.title}. \n`;
    }
    return cat.title;
  });

  const promptCat = categoriesLine.join(", ");

  let prompt =
    "Base on the following lines that read from a credit card statement PDF, help me extract lines of expense in the following template. Note: Please list all the expenses. \n";
  prompt += "{date}, {descrption}, {amount}, {category} \n";
  prompt +=
    "The date should be in the format of DD MMM YYYY, for example : 12 Dec 2023  \n";
  prompt += `The category should base on the description and be one of these options: ${promptCat} \n`;
  if (keywordPrompt) {
    prompt += keywordPrompt;
  }
  prompt +=
    "The amount should be in the format of Decimal without $ sign, example of {total payable amount} : 1216.12 \n";
  prompt += "Please Ignore previous balance \n";
  prompt += "Dont include number for each result line like 1.xx, 2.xx \n";
  prompt +=
    "Each generated result line should be just {date}, {descrption}, {amount}, {category} Without any bullet point, '-', numbering infront. ";
  prompt += "Dont use any markdown like **{text}** when generate the result \n";

  prompt +=
    "Also help determine the issuance bank, the statment issue date and total payable amount on the format of: \n";
  prompt += "bank: {bank name} \n";
  prompt += "statement date: {statement due date} \n";
  prompt += "total amount: {total payable amount} \n";

  prompt += "statement date should be in the format of DD MMM YYYY \n";
  prompt +=
    "if possible use these symbol for {bank name}: DBS, POSB, UOB, CITI, AMEX, OCBC, HSBC, SCB, BOC \n";

  prompt += "Example of parse result will be: \n\n";
  prompt += "28 Jun 2024, Nespresso ION Singapore SG, 38.60, Food \n";
  prompt += "28 Jun 2024, AMAZE* NANDOS.COMN SINGAPORE SG, 33.10, Food \n";

  prompt += "Additional Information: \n";
  prompt += "bank: DBS \n";
  prompt += "statement date: 19 Jul 2024 \n";
  prompt += "total amount: 1123.20 \n";

  prompt += "The following is the text extract from PDF statement : ";

  prompt += statementText + "\n";

  return prompt;
}
