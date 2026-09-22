export const referralMessageJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    message: { type: 'string' },
    evidenceRefs: { type: 'array', minItems: 1, maxItems: 8, items: { type: 'string' } },
    warnings: { type: 'array', maxItems: 10, items: { type: 'string' } },
  },
  required: ['message', 'evidenceRefs', 'warnings'],
};
