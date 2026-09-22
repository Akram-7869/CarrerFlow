const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9+#. /-]/g, ' ').replace(/\s+/g, ' ').trim();
const metricTokens = (value) => value.match(/(?:\b\d+(?:\.\d+)?%|[$₹€£]\s?\d+(?:\.\d+)?|\b\d+(?:\.\d+)?\+?\b)/g) || [];

export const buildCareerEvidenceCorpus = ({ profile, resume, resumeData }) => [
  resume.parsed_text,
  JSON.stringify(profile),
  JSON.stringify(resumeData),
].filter(Boolean).join('\n');

const containsPhrase = (text, phrase) => {
  const haystack = ` ${normalize(text)} `;
  const needle = normalize(phrase);
  return needle && haystack.includes(` ${needle} `);
};

export const validateTailoredText = ({ proposedText, evidenceRefs, evidenceCorpus, forbiddenSkills }) => {
  const errors = [];
  if (!proposedText?.trim()) errors.push('Proposed text is empty.');

  for (const evidence of evidenceRefs || []) {
    if (!evidence || !normalize(evidenceCorpus).includes(normalize(evidence))) {
      errors.push('An evidence reference was not found in the verified career data.');
      break;
    }
  }
  if (!evidenceRefs?.length) errors.push('At least one evidence reference is required.');

  for (const skill of forbiddenSkills) {
    if (containsPhrase(proposedText, skill)) errors.push(`Unsupported or partial skill “${skill}” cannot be added.`);
  }

  const corpusMetrics = new Set(metricTokens(evidenceCorpus));
  for (const metric of metricTokens(proposedText)) {
    if (!corpusMetrics.has(metric)) errors.push(`Metric “${metric}” is not supported by career evidence.`);
  }

  return { valid: errors.length === 0, errors };
};

export const resolveProposalTarget = (resumeData, proposal) => {
  if (proposal.proposalType === 'summary') return resumeData.summary || '';
  if (proposal.proposalType === 'skill_reorder') return JSON.stringify(resumeData.skills.map((skill) => skill.name));
  const collection = proposal.sectionType === 'experience' ? resumeData.experiences : resumeData.projects;
  const item = collection[proposal.itemIndex];
  if (!item) return null;
  if (proposal.bulletIndex === -1) return item.description || '';
  return item.highlights?.[proposal.bulletIndex] ?? null;
};

export const validateSkillOrder = (resumeData, requestedOrder) => {
  const original = resumeData.skills.map((skill) => skill.name);
  const byCanonical = new Map(original.map((name) => [normalize(name), name]));
  const ordered = [];
  const seen = new Set();
  for (const name of requestedOrder) {
    const canonical = normalize(name);
    if (byCanonical.has(canonical) && !seen.has(canonical)) {
      ordered.push(byCanonical.get(canonical));
      seen.add(canonical);
    }
  }
  for (const name of original) {
    const canonical = normalize(name);
    if (!seen.has(canonical)) ordered.push(name);
  }
  return ordered;
};
