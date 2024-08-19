import { fromBuffer } from "pdf2pic";
import PDFExtract from "pdf.js-extract";
import { createWorker } from "tesseract.js";

const pdfExtract = new PDFExtract.PDFExtract();

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

  const content = await pdfExtract.extractBuffer(fileBuffer);
  let pdfText = "";

  for (let i = 0; i < content.pages.length; i++) {
    const convert = fromBuffer(fileBuffer, {
      density: 200,
      format: "png",
      width: 2000,
      height: 2000,
    });

    const saveImage = await convert(i + 1, { responseType: "buffer" });

    if (saveImage.buffer) {
      const worker = await createWorker("eng");
      const ret = await worker.recognize(saveImage.buffer);
      pdfText += ret.data.text;
      await worker.terminate();
    }
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
