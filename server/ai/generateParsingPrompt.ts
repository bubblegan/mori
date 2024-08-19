import { pdfToPng } from "pdf-to-png-converter";
import { createWorker } from "tesseract.js";

async function generateParsingPrompt(fileBuffer: Buffer) {
  let prompt =
    "Base on the following lines that read from a credit card statement PDf, help me extract lines of expense in the following template. Note: Please list all the expenses. \n";
  prompt += "{date}, {descrption}, {amount} \n";
  prompt += "The date should be in the format of DD MMM YYYY \n";
  prompt += "The amount should be in the format of Decimal without $ sign \n";
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

  let pdfText = "";

  const pngPages = await pdfToPng(fileBuffer, {
    viewportScale: 5,
    disableFontFace: false,
  });

  for (const page of pngPages) {
    const worker = await createWorker("eng");
    const ret = await worker.recognize(page.content);
    pdfText += ret.data.text;
    await worker.terminate();
  }

  // for DBS cut off
  if (pdfText.includes("SPECIALLY FOR YOU")) {
    pdfText = pdfText.substring(0, pdfText.indexOf("SPECIALLY FOR YOU"));
  }

  // for AMEX cut off
  if (pdfText.includes("INFORMATION ABOUT THE AMERICAN EXPRESS CARD")) {
    pdfText = pdfText.substring(0, pdfText.indexOf("INFORMATION ABOUT THE AMERICAN EXPRESS CARD"));
  }

  // for CITI cut off
  if (pdfText.includes("Protect Yourself from Fraud ")) {
    pdfText = pdfText.substring(0, pdfText.indexOf("Protect Yourself from Fraud"));
  }

  prompt += pdfText + "\n";

  return prompt;
}

export default generateParsingPrompt;
