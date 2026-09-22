const stringArray = { type: 'array', items: { type: 'string' } };
const skillArray = {
  type: 'array',
  items: {
    type: 'object', additionalProperties: false,
    properties: { name: { type: 'string' }, evidence: { type: 'string' } },
    required: ['name', 'evidence'],
  },
};

export const jobAnalysisJsonSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    requiredSkills: skillArray,
    preferredSkills: skillArray,
    minYearsExperience: { type: ['number', 'null'] },
    maxYearsExperience: { type: ['number', 'null'] },
    experienceLevel: { type: 'string', enum: ['internship', 'entry', 'mid', 'senior', 'lead', 'unspecified'] },
    responsibilities: stringArray,
    educationRequirements: stringArray,
    location: { type: 'string' },
    workMode: { type: 'string', enum: ['remote', 'hybrid', 'onsite', 'unspecified'] },
    employmentType: { type: 'string', enum: ['full_time', 'part_time', 'contract', 'internship', 'temporary', 'unspecified'] },
    keywords: stringArray,
    warnings: stringArray,
  },
  required: ['summary', 'requiredSkills', 'preferredSkills', 'minYearsExperience', 'maxYearsExperience', 'experienceLevel', 'responsibilities', 'educationRequirements', 'location', 'workMode', 'employmentType', 'keywords', 'warnings'],
};
