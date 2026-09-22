const MATCHER_VERSION = '1.0.0';

const aliases = new Map(Object.entries({
  'node.js': 'nodejs', 'node js': 'nodejs', node: 'nodejs', 'react.js': 'react', reactjs: 'react',
  'next.js': 'nextjs', 'next js': 'nextjs', next: 'nextjs', 'vue.js': 'vue', vuejs: 'vue',
  'postgresql': 'postgres', 'postgre sql': 'postgres', 'amazon web services': 'aws',
  'google cloud platform': 'gcp', 'microsoft azure': 'azure', 'restful api': 'rest api',
  'restful apis': 'rest api', 'rest apis': 'rest api', 'ci/cd': 'cicd',
}));

const relatedGroups = [
  ['javascript', 'typescript'], ['react', 'nextjs'], ['nodejs', 'express'], ['aws', 'gcp', 'azure', 'cloud'],
  ['docker', 'kubernetes', 'containers'], ['postgres', 'mysql', 'sql'], ['mongodb', 'nosql'],
  ['git', 'github', 'gitlab'], ['rest api', 'graphql', 'api'], ['html', 'css', 'frontend'],
];

const stopwords = new Set(['and', 'the', 'with', 'for', 'from', 'that', 'this', 'will', 'your', 'our', 'you', 'are', 'have', 'has', 'into', 'using', 'work', 'role', 'team', 'skills', 'experience', 'years']);
const normalize = (value) => {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9+#. /-]/g, ' ').replace(/\s+/g, ' ').trim();
  return aliases.get(cleaned) || cleaned;
};
const tokens = (value) => normalize(value).split(/[\s/,-]+/).filter((token) => token.length > 2 && !stopwords.has(token));

const related = (required, candidate) => relatedGroups.some((group) => group.includes(required) && group.includes(candidate));

const buildEvidence = (profile, resumeData) => {
  const entries = [];
  const add = (name, source, detail, verified) => {
    if (name) entries.push({ canonical: normalize(name), name, source, detail: detail || name, verified });
  };

  for (const skill of profile.skills) add(skill.name, 'career_profile_skill', skill.evidence, true);
  for (const experience of profile.experiences) {
    for (const technology of experience.technologies || []) add(technology, 'career_profile_experience', `${experience.jobTitle} at ${experience.company}`, true);
  }
  for (const project of profile.projects) {
    for (const technology of project.technologies || []) add(technology, 'career_profile_project', project.name, true);
  }
  for (const skill of resumeData.skills || []) add(skill.name, 'selected_resume', skill.evidence, false);
  return entries;
};

const classifySkill = (requirement, evidence) => {
  const target = normalize(requirement.name);
  const exact = evidence.filter((item) => item.canonical === target);
  if (exact.length) return { requirement: requirement.name, classification: 'supported', evidence: exact.slice(0, 3), relatedSkills: [] };

  const partial = evidence.filter((item) => related(target, item.canonical)
    || (target.length > 4 && item.canonical.includes(target))
    || (item.canonical.length > 4 && target.includes(item.canonical)));
  if (partial.length) return {
    requirement: requirement.name,
    classification: 'partial',
    evidence: partial.slice(0, 3),
    relatedSkills: [...new Set(partial.map((item) => item.name))],
  };
  return { requirement: requirement.name, classification: 'missing', evidence: [], relatedSkills: [] };
};

const ratioScore = (results) => {
  if (!results.length) return null;
  return Math.round((results.reduce((total, item) => total + (item.classification === 'supported' ? 1 : item.classification === 'partial' ? 0.5 : 0), 0) / results.length) * 100);
};

export const matchResumeToJob = ({ jobAnalysis, profile, resume, resumeData }) => {
  const evidence = buildEvidence(profile, resumeData);
  const required = jobAnalysis.requiredSkills.map((skill) => ({ ...classifySkill(skill, evidence), requirementType: 'required' }));
  const preferred = jobAnalysis.preferredSkills.map((skill) => ({ ...classifySkill(skill, evidence), requirementType: 'preferred' }));
  const skillResults = [...required, ...preferred];

  const candidateYears = profile.yearsExperience;
  const requiredYears = jobAnalysis.minYearsExperience;
  const experiencePercent = requiredYears === null ? null
    : candidateYears === null ? 0
      : Math.min(100, Math.round((candidateYears / Math.max(requiredYears, 1)) * 100));
  const experienceMatch = {
    requiredYears,
    candidateYears,
    classification: requiredYears === null ? 'not_specified' : candidateYears === null ? 'unknown' : candidateYears >= requiredYears ? 'supported' : candidateYears >= requiredYears * 0.7 ? 'partial' : 'missing',
    percent: experiencePercent,
  };

  const careerText = normalize([
    resume.parsed_text,
    profile.summary,
    ...profile.experiences.flatMap((item) => [item.description, ...(item.highlights || [])]),
    ...profile.projects.flatMap((item) => [item.description, ...(item.highlights || [])]),
  ].filter(Boolean).join(' '));

  const responsibilityResults = jobAnalysis.responsibilities.map((responsibility) => {
    const meaningful = tokens(responsibility);
    const matched = meaningful.filter((token) => careerText.includes(token));
    const percent = meaningful.length ? Math.round((matched.length / meaningful.length) * 100) : 0;
    return { responsibility, matchedKeywords: matched, percent, classification: percent >= 50 ? 'supported' : percent >= 20 ? 'partial' : 'missing' };
  });
  const responsibilityPercent = responsibilityResults.length
    ? Math.round(responsibilityResults.reduce((sum, item) => sum + item.percent, 0) / responsibilityResults.length)
    : null;

  const keywordResults = jobAnalysis.keywords.map((keyword) => ({ keyword, matched: careerText.includes(normalize(keyword)) }));
  const keywordPercent = keywordResults.length
    ? Math.round((keywordResults.filter((item) => item.matched).length / keywordResults.length) * 100)
    : null;

  const categories = [
    { key: 'requiredSkills', weight: 50, percent: ratioScore(required) },
    { key: 'preferredSkills', weight: 15, percent: ratioScore(preferred) },
    { key: 'experience', weight: 15, percent: experiencePercent },
    { key: 'responsibilities', weight: 10, percent: responsibilityPercent },
    { key: 'keywords', weight: 10, percent: keywordPercent },
  ];
  const active = categories.filter((item) => item.percent !== null);
  const activeWeight = active.reduce((sum, item) => sum + item.weight, 0) || 1;
  const matchScore = Math.round(active.reduce((sum, item) => sum + item.percent * item.weight, 0) / activeWeight);
  const scoreBreakdown = Object.fromEntries(categories.map((item) => [item.key, { percent: item.percent, weight: item.percent === null ? 0 : Math.round((item.weight / activeWeight) * 100) }]));

  return {
    matchScore,
    recommendation: matchScore >= 80 ? 'use_existing_resume' : matchScore >= 60 ? 'targeted_changes' : 'significant_gaps',
    scoreBreakdown,
    supported: skillResults.filter((item) => item.classification === 'supported'),
    partial: skillResults.filter((item) => item.classification === 'partial'),
    missing: skillResults.filter((item) => item.classification === 'missing'),
    experienceMatch,
    responsibilityMatch: { percent: responsibilityPercent, results: responsibilityResults },
    keywordMatch: { percent: keywordPercent, results: keywordResults },
    matcherVersion: MATCHER_VERSION,
  };
};
