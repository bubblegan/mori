// this import is needed in to configure a default worker for pdfjs
import "pdfjs-dist/build/pdf.worker.mjs";
import Tesseract from "tesseract.js";

export async function extractTextFromPDF(
  statement: File,
  onProgress: (params: [currentPage: number, totalPage: number]) => void
) {
  const { getDocument } = await import("pdfjs-dist");
  const pdf = await getDocument(URL.createObjectURL(statement)).promise;
  let pdfText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress([pageNum, pdf.numPages]);
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
      const text = await Tesseract.recognize(canvas, "eng").then(({ data: { text } }) => text);
      pdfText += text + "\n\n";
    }
  }

  // trimming
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

  return pdfText;
}
