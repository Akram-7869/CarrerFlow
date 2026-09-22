import { PDFDocument, StandardFonts } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { extractDocumentText } from '../src/services/document-parser-service.js';

describe('local resume document parser', () => {
  it('extracts text from a genuine PDF without using an AI API', async () => {
    const document = await PDFDocument.create();
    const page = document.addPage([600, 800]);
    const font = await document.embedFont(StandardFonts.Helvetica);
    page.drawText('Asha Rao - Full Stack Developer', { x: 50, y: 740, size: 14, font });
    page.drawText('JavaScript React Node.js PostgreSQL Express', { x: 50, y: 710, size: 12, font });
    page.drawText('Built accessible web applications for Acme Labs from 2023 to present.', { x: 50, y: 680, size: 12, font });
    const buffer = Buffer.from(await document.save());

    const text = await extractDocumentText(buffer, 'application/pdf');

    expect(text).toContain('Asha Rao');
    expect(text).toContain('PostgreSQL');
    expect(text).toContain('Acme Labs');
  });
});
