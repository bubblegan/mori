export function generateParsingPrompt(statementText: string) {
  let prompt =
    "Base on the following lines that read from a credit card statement PDf, help me extract lines of expense in the following template. Note: Please list all the expenses. \n";
  prompt += "{date}, {descrption}, {amount} \n";
  prompt += "The date should be in the format of DD MMM YYYY, for example : 12 Dec 2023  \n";
  prompt +=
    "The amount should be in the format of Decimal without $ sign, example of {total payable amount} : 1216.12 \n";
  prompt += "Please Ignore previous balance \n";
  prompt += "Dont include number for each line like 1.xx, 2.xx \n";

  prompt +=
    "Also help determine the issuance bank, the statment issue date and total payable amount on the format of: \n";
  prompt += "bank: {bank name} \n";
  prompt += "statement date: {statement due date} \n";
  prompt += "total amount: {total payable amount} \n";

  prompt += "statement date should be in the format of DD MMM YYYY \n";
  prompt +=
    "if possible use these symbol for {bank name}: DBS, POSB, UOB, CITI, AMEX, OCBC, HSBC, SCB, BOC \n";

  prompt += statementText + "\n";

  return prompt;
}
