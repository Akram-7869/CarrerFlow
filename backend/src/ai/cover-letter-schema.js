export const coverLetterJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    coverLetter: { type: 'string' },
    evidenceRefs: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string' } },
    warnings: { type: 'array', maxItems: 10, items: { type: 'string' } },
  },
  required: ['coverLetter', 'evidenceRefs', 'warnings'],
};
