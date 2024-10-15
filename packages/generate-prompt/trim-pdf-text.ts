const TRIM_TEXT = [
  // DBS
  "UPDATE YOUR MAILING ADDRESS",
  // Amex
  "INFORMATION ABOUT THE AMERICAN EXPRESS CARD",
  // CITI
  "Protect Yourself from Fraud ",
];

export function trimPdfText(pdfText: string) {
  TRIM_TEXT.forEach((text) => {
    if (pdfText.includes(text)) {
      pdfText = pdfText.substring(0, pdfText.indexOf(text));
    }
  });
  return pdfText;
}
