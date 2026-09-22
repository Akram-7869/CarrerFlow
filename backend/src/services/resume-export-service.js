import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const xmlEscape = (value) => String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const paragraph = (text, options = {}) => `<w:p><w:pPr>${options.heading ? '<w:keepNext/><w:spacing w:before="220" w:after="80"/>' : '<w:spacing w:after="80"/>'}</w:pPr><w:r><w:rPr>${options.bold || options.heading ? '<w:b/>' : ''}${options.heading ? '<w:sz w:val="26"/>' : ''}</w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;

const contentLines = (content) => {
  const lines = [];
  const basic = content.basicInfo;
  lines.push({ text: basic.name || 'Resume', heading: true });
  lines.push({ text: [basic.email, basic.phone, basic.location].filter(Boolean).join(' | ') });
  lines.push({ text: [basic.linkedinUrl, basic.githubUrl, basic.portfolioUrl].filter(Boolean).join(' | ') });
  if (content.summary) lines.push({ text: 'PROFESSIONAL SUMMARY', heading: true }, { text: content.summary });
  if (content.skills.length) lines.push({ text: 'SKILLS', heading: true }, { text: content.skills.map((item) => item.name).join(' • ') });
  if (content.experiences.length) {
    lines.push({ text: 'EXPERIENCE', heading: true });
    for (const item of content.experiences) {
      lines.push({ text: `${item.jobTitle} | ${item.company}${item.location ? ` | ${item.location}` : ''}`, bold: true });
      lines.push({ text: [item.startDate, item.endDate || (item.isCurrent ? 'Present' : '')].filter(Boolean).join(' – ') });
      if (item.description) lines.push({ text: item.description });
      for (const bullet of item.highlights || []) lines.push({ text: `• ${bullet}` });
    }
  }
  if (content.projects.length) {
    lines.push({ text: 'PROJECTS', heading: true });
    for (const item of content.projects) {
      lines.push({ text: item.name, bold: true });
      if (item.description) lines.push({ text: item.description });
      for (const bullet of item.highlights || []) lines.push({ text: `• ${bullet}` });
    }
  }
  if (content.education.length) {
    lines.push({ text: 'EDUCATION', heading: true });
    for (const item of content.education) lines.push({ text: `${item.degree}${item.fieldOfStudy ? ` in ${item.fieldOfStudy}` : ''} | ${item.institution}`, bold: true }, { text: [item.startDate, item.endDate, item.grade].filter(Boolean).join(' | ') });
  }
  if (content.certifications.length) {
    lines.push({ text: 'CERTIFICATIONS', heading: true });
    for (const item of content.certifications) lines.push({ text: `${item.name}${item.issuer ? ` — ${item.issuer}` : ''}` });
  }
  return lines.filter((line) => line.text);
};

export const generateDocx = async (content) => {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.folder('_rels').file('.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  const body = contentLines(content).map((line) => paragraph(line.text, line)).join('');
  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>`);
  return zip.generateAsync({ type: 'nodebuffer' });
};

const wrap = (text, font, size, maxWidth) => {
  const result = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else { if (line) result.push(line); line = word; }
  }
  if (line) result.push(line);
  return result;
};

export const generatePdf = async (content) => {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  let page = document.addPage([612, 792]);
  let y = 748;
  for (const line of contentLines(content)) {
    const font = line.bold || line.heading ? bold : regular;
    const size = line.heading ? 12 : 10;
    if (line.heading && y < 700) y -= 8;
    for (const wrapped of wrap(line.text, font, size, 516)) {
      if (y < 48) { page = document.addPage([612, 792]); y = 748; }
      page.drawText(wrapped, { x: 48, y, size, font, color: rgb(0.08, 0.12, 0.09) });
      y -= line.heading ? 17 : 14;
    }
  }
  return Buffer.from(await document.save());
};
