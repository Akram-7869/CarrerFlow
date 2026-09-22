const ANALYZER_VERSION = '1.0.0';

const CATEGORY_MAXIMUMS = {
  parsability: 15,
  contact: 10,
  structure: 15,
  skills: 15,
  experience: 20,
  achievements: 15,
  content: 10,
};

const actionVerbs = new Set([
  'achieved', 'automated', 'built', 'created', 'delivered', 'designed', 'developed',
  'drove', 'implemented', 'improved', 'increased', 'launched', 'led', 'managed',
  'optimized', 'reduced', 'resolved', 'scaled', 'streamlined', 'supported',
]);
const severityOrder = { high: 0, medium: 1, low: 2 };

const words = (text) => (text.match(/[\p{L}\p{N}+#.-]+/gu) || []);
const normalize = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();
const hasMetric = (text) => /(?:\b\d+(?:\.\d+)?%|[$₹€£]\s?\d|\b\d+[kKmMbB]\+?\b|\b\d+\+?\s+(?:users|customers|clients|requests|projects|features|hours|days|people|members)\b)/i.test(text);
const startsWithActionVerb = (text) => actionVerbs.has((words(text)[0] || '').toLowerCase());

const createCollector = () => {
  const scores = { ...CATEGORY_MAXIMUMS };
  const issues = [];
  const strengths = [];
  const suggestions = [];

  const deduct = (category, points, code, severity, title, message, evidence = '') => {
    const actual = Math.min(points, scores[category]);
    scores[category] -= actual;
    issues.push({ code, category, severity, title, message, evidence, pointsDeducted: actual });
  };
  const praise = (category, title, message) => strengths.push({ category, title, message });
  const suggest = (category, title, message) => suggestions.push({ category, title, message });

  return { scores, issues, strengths, suggestions, deduct, praise, suggest };
};

const collectBullets = (profile) => [
  ...profile.experiences.flatMap((item) => item.highlights?.length ? item.highlights : [item.description]),
  ...profile.projects.flatMap((item) => item.highlights?.length ? item.highlights : [item.description]),
].map((item) => item?.trim()).filter(Boolean);

export const analyzeResumeForAts = ({ parsedText, structuredData }) => {
  const profile = structuredData;
  const collector = createCollector();
  const { deduct, praise, suggest } = collector;
  const wordCount = words(parsedText).length;
  const replacementCharacters = (parsedText.match(/�/g) || []).length;
  const bullets = collectBullets(profile);
  const measurableBullets = bullets.filter(hasMetric);
  const actionBullets = bullets.filter(startsWithActionVerb);

  if (parsedText.length >= 500) praise('parsability', 'Readable text extraction', 'The resume produced enough machine-readable text for reliable analysis.');
  else deduct('parsability', 6, 'LOW_EXTRACTED_TEXT', 'high', 'Limited machine-readable text', 'The resume produced very little text. Avoid image-only content and verify the exported file.', `${wordCount} words detected`);
  if (replacementCharacters > 3) deduct('parsability', 5, 'ENCODING_PROBLEMS', 'high', 'Some characters did not parse correctly', 'Re-export the document using common fonts and standard Unicode characters.', `${replacementCharacters} unreadable characters detected`);

  const contact = profile.basicInfo || {};
  if (!contact.name) deduct('contact', 2, 'MISSING_NAME', 'high', 'Name not detected', 'Place your full name prominently near the top of the resume.');
  if (!contact.email) deduct('contact', 3, 'MISSING_EMAIL', 'high', 'Email not detected', 'Add a professional email address in plain text.');
  if (!contact.phone) deduct('contact', 2, 'MISSING_PHONE', 'medium', 'Phone number not detected', 'Add a reachable phone number in plain text.');
  if (!contact.linkedinUrl && !contact.githubUrl && !contact.portfolioUrl) deduct('contact', 3, 'MISSING_PROFESSIONAL_LINK', 'low', 'No professional link detected', 'Consider adding LinkedIn, GitHub, or a relevant portfolio URL.');
  if (contact.name && contact.email) praise('contact', 'Core contact details detected', 'Your name and email are available to a parser.');

  if (!profile.summary) deduct('structure', 3, 'MISSING_SUMMARY', 'low', 'Professional summary is missing', 'Add a concise, evidence-based summary targeted to your role.');
  if (!profile.skills.length) deduct('structure', 4, 'MISSING_SKILLS_SECTION', 'high', 'Skills section is missing', 'Add a clearly labelled skills section.');
  if (!profile.experiences.length) deduct('structure', 5, 'MISSING_EXPERIENCE_SECTION', 'high', 'Work experience is missing', 'Add relevant work experience with company, title, and dates.');
  if (!profile.education.length) deduct('structure', 2, 'MISSING_EDUCATION_SECTION', 'medium', 'Education section is missing', 'Add your education or relevant formal training.');
  if (!profile.projects.length && !profile.certifications.length) deduct('structure', 1, 'LIMITED_SUPPORTING_SECTIONS', 'low', 'No projects or certifications detected', 'Add relevant projects or certifications only when they strengthen your candidacy.');
  if (profile.skills.length && profile.experiences.length && profile.education.length) praise('structure', 'Core sections detected', 'Skills, experience, and education are clearly represented.');

  const normalizedSkills = profile.skills.map((item) => normalize(item.name)).filter(Boolean);
  const duplicateSkills = normalizedSkills.length - new Set(normalizedSkills).size;
  if (normalizedSkills.length === 0) deduct('skills', 15, 'NO_SKILLS', 'high', 'No skills detected', 'Include a concise list of technologies and capabilities you can support with evidence.');
  else if (normalizedSkills.length < 5) deduct('skills', 6, 'FEW_SKILLS', 'medium', 'Skills coverage is limited', 'Add other relevant skills that are genuinely supported by your experience.');
  else praise('skills', 'Useful skills coverage', `${normalizedSkills.length} distinct skills were detected.`);
  if (normalizedSkills.length > 40) deduct('skills', 3, 'TOO_MANY_SKILLS', 'low', 'Skills list may be unfocused', 'Prioritize your strongest and most relevant skills.');
  if (duplicateSkills) deduct('skills', Math.min(3, duplicateSkills), 'DUPLICATE_SKILLS', 'low', 'Duplicate skills detected', 'Remove repeated or differently-cased copies of the same skill.', `${duplicateSkills} duplicate entries`);

  if (profile.experiences.length) {
    const incomplete = profile.experiences.filter((item) => !item.company || !item.jobTitle || !item.startDate).length;
    const thin = profile.experiences.filter((item) => words(`${item.description} ${(item.highlights || []).join(' ')}`).length < 12).length;
    if (incomplete) deduct('experience', Math.min(8, incomplete * 3), 'INCOMPLETE_EXPERIENCE', 'high', 'Some experience entries are incomplete', 'Include company, job title, and dates for each role.', `${incomplete} incomplete entries`);
    if (thin) deduct('experience', Math.min(8, thin * 3), 'THIN_EXPERIENCE', 'medium', 'Some roles need more evidence', 'Add concise accomplishment-focused bullets for each relevant role.', `${thin} thin entries`);
    if (!incomplete && !thin) praise('experience', 'Experience entries are complete', 'Your roles include useful identifying details and supporting content.');
  } else {
    deduct('experience', 20, 'NO_EXPERIENCE', 'high', 'No work experience detected', 'Add relevant employment, internships, freelance work, or equivalent experience.');
  }

  if (!bullets.length) {
    deduct('achievements', 12, 'NO_ACHIEVEMENT_BULLETS', 'high', 'No achievement bullets detected', 'Use concise bullets describing what you changed, built, improved, or delivered.');
  } else {
    if (!measurableBullets.length) deduct('achievements', 6, 'NO_MEASURABLE_IMPACT', 'medium', 'No measurable impact detected', 'Where truthful, add scale, percentages, time saved, users served, or other measurable outcomes.');
    else praise('achievements', 'Measurable impact detected', `${measurableBullets.length} bullet${measurableBullets.length === 1 ? '' : 's'} include concrete scale or outcomes.`);
    if (actionBullets.length / bullets.length < 0.5) deduct('achievements', 4, 'WEAK_BULLET_OPENINGS', 'medium', 'Many bullets lack strong action openings', 'Begin accomplishment bullets with direct action verbs.');
    else praise('achievements', 'Action-oriented writing', 'Most detected bullets begin with clear action language.');
  }

  if (wordCount < 200) deduct('content', 5, 'RESUME_TOO_SHORT', 'medium', 'Resume content may be too brief', 'Add enough evidence to explain your relevant skills and accomplishments.', `${wordCount} words`);
  if (wordCount > 1200) deduct('content', 4, 'RESUME_TOO_LONG', 'medium', 'Resume may be overly long', 'Remove repetition and keep only role-relevant evidence.', `${wordCount} words`);
  const longBullets = bullets.filter((item) => words(item).length > 35).length;
  if (longBullets) deduct('content', Math.min(3, longBullets), 'LONG_BULLETS', 'low', 'Some bullets are difficult to scan', 'Keep most bullets under roughly 35 words.', `${longBullets} long bullets`);
  const firstPersonCount = (parsedText.match(/\b(?:I|me|my|mine)\b/gi) || []).length;
  if (firstPersonCount > 2) deduct('content', 2, 'FIRST_PERSON_OVERUSE', 'low', 'First-person language is overused', 'Resume bullets usually read more directly without repeated first-person pronouns.');
  if (wordCount >= 200 && wordCount <= 1200 && !longBullets) praise('content', 'Scannable content length', 'The resume length and detected bullet size are within practical ranges.');

  if (!measurableBullets.length) suggest('achievements', 'Add evidence, not invented numbers', 'Quantify impact only where you can verify the number. Never manufacture a metric.');
  if (!profile.summary) suggest('structure', 'Write a focused summary', 'Use 2–3 lines describing your real experience, strongest skills, and target contribution.');

  const overallScore = Object.values(collector.scores).reduce((total, score) => total + score, 0);
  const rating = overallScore >= 85 ? 'excellent' : overallScore >= 70 ? 'strong' : overallScore >= 50 ? 'developing' : 'needs_work';

  return {
    overallScore,
    rating,
    scores: collector.scores,
    maximums: CATEGORY_MAXIMUMS,
    issues: collector.issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]),
    strengths: collector.strengths,
    suggestions: collector.suggestions,
    metrics: {
      wordCount,
      skillCount: normalizedSkills.length,
      experienceCount: profile.experiences.length,
      bulletCount: bullets.length,
      measurableBulletCount: measurableBullets.length,
      actionBulletCount: actionBullets.length,
    },
    analyzerVersion: ANALYZER_VERSION,
  };
};
