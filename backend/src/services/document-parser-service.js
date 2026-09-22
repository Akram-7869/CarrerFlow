import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { AppError } from '../utils/app-error.js';

const cleanText = (text) =>
  text
    .replaceAll(String.fromCharCode(0), '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const parsePdf = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
};

const parseDocx = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};

export const extractDocumentText = async (buffer, mimeType) => {
  let rawText;
  try {
    rawText = mimeType === 'application/pdf' ? await parsePdf(buffer) : await parseDocx(buffer);
  } catch {
    throw new AppError(422, 'DOCUMENT_PARSE_FAILED', 'The resume could not be read. Try exporting it as a new PDF or DOCX file.');
  }

  const parsedText = cleanText(rawText || '');
  if (parsedText.length < 80) {
    throw new AppError(422, 'INSUFFICIENT_TEXT', 'Very little text was found. The file may be scanned or image-based.');
  }

  return parsedText.slice(0, 100_000);
};
