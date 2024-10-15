// this import is needed in to configure a default worker for pdfjs
import { trimPdfText } from "@self-hosted-expense-tracker/generate-prompt";
import "pdfjs-dist/build/pdf.worker.mjs";
import Tesseract from "tesseract.js";

export async function extractTextFromPDF(
  statement: File,
  onProgress: (params: [currentPage: number, totalPage: number]) => void
) {
  const { getDocument } = await import("pdfjs-dist");
  try {
    const pdf = await getDocument(URL.createObjectURL(statement)).promise;
    let pdfText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      onProgress([pageNum, pdf.numPages]);
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 3 });
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
    pdfText = trimPdfText(pdfText);
    return pdfText;
  } catch (error) {
    throw error;
  }
}
