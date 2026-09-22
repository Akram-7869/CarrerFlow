import { validateTailoredText } from './tailoring-guard-service.js';

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9+#. /-]/g, ' ').replace(/\s+/g, ' ').trim();
const falseRelationshipPatterns = [
  /\bwe (?:met|worked|spoke|connected)\b/i,
  /\bmutual (?:friend|connection|contact)\b/i,
  /\bi (?:have )?(?:followed|been following) your work\b/i,
  /\byou referred me\b/i,
];

export const unsupportedJobSkills = (jobAnalysis, evidenceCorpus) => [
  ...(jobAnalysis?.requiredSkills || []), ...(jobAnalysis?.preferredSkills || []),
].map((skill) => skill.name).filter((skill) => skill && !normalize(evidenceCorpus).includes(normalize(skill)));

export const validateReferralMessage = ({ message, evidenceRefs, evidenceCorpus, forbiddenSkills }) => {
  const grounded = validateTailoredText({ proposedText: message, evidenceRefs, evidenceCorpus, forbiddenSkills });
  const errors = [...grounded.errors];
  if (falseRelationshipPatterns.some((pattern) => pattern.test(message))) {
    errors.push('The message implies an unverified relationship or shared connection.');
  }
  return { valid: errors.length === 0, errors };
};
