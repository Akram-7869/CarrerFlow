export const resumeExtractionJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    basicInfo: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        location: { type: 'string' },
        linkedinUrl: { type: 'string' },
        githubUrl: { type: 'string' },
        portfolioUrl: { type: 'string' },
      },
      required: ['name', 'email', 'phone', 'location', 'linkedinUrl', 'githubUrl', 'portfolioUrl'],
    },
    summary: { type: 'string' },
    yearsExperience: { type: ['number', 'null'] },
    skills: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          level: { type: 'string' },
          years: { type: ['number', 'null'] },
          evidence: { type: 'string' },
        },
        required: ['name', 'level', 'years', 'evidence'],
      },
    },
    experiences: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          company: { type: 'string' }, jobTitle: { type: 'string' }, location: { type: 'string' },
          startDate: { type: 'string' }, endDate: { type: 'string' }, isCurrent: { type: 'boolean' },
          description: { type: 'string' }, highlights: { type: 'array', items: { type: 'string' } },
          technologies: { type: 'array', items: { type: 'string' } }, evidence: { type: 'string' },
        },
        required: ['company', 'jobTitle', 'location', 'startDate', 'endDate', 'isCurrent', 'description', 'highlights', 'technologies', 'evidence'],
      },
    },
    education: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          institution: { type: 'string' }, degree: { type: 'string' }, fieldOfStudy: { type: 'string' },
          location: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' },
          grade: { type: 'string' }, description: { type: 'string' }, evidence: { type: 'string' },
        },
        required: ['institution', 'degree', 'fieldOfStudy', 'location', 'startDate', 'endDate', 'grade', 'description', 'evidence'],
      },
    },
    projects: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          name: { type: 'string' }, description: { type: 'string' }, url: { type: 'string' },
          startDate: { type: 'string' }, endDate: { type: 'string' },
          highlights: { type: 'array', items: { type: 'string' } },
          technologies: { type: 'array', items: { type: 'string' } }, evidence: { type: 'string' },
        },
        required: ['name', 'description', 'url', 'startDate', 'endDate', 'highlights', 'technologies', 'evidence'],
      },
    },
    certifications: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          name: { type: 'string' }, issuer: { type: 'string' }, issueDate: { type: 'string' },
          expiryDate: { type: 'string' }, credentialId: { type: 'string' }, credentialUrl: { type: 'string' },
          evidence: { type: 'string' },
        },
        required: ['name', 'issuer', 'issueDate', 'expiryDate', 'credentialId', 'credentialUrl', 'evidence'],
      },
    },
    warnings: { type: 'array', items: { type: 'string' } },
  },
  required: ['basicInfo', 'summary', 'yearsExperience', 'skills', 'experiences', 'education', 'projects', 'certifications', 'warnings'],
};
