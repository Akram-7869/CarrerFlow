const evidenceRefs = { type: 'array', minItems: 1, maxItems: 10, items: { type: 'string' } };
const proposalProperties = {
  originalText: { type: 'string' }, proposedText: { type: 'string' },
  rationale: { type: 'string' }, evidenceRefs,
};

export const tailoringJsonSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    summaryProposal: {
      anyOf: [
        { type: 'object', additionalProperties: false, properties: proposalProperties, required: ['originalText', 'proposedText', 'rationale', 'evidenceRefs'] },
        { type: 'null' },
      ],
    },
    skillOrder: { type: 'array', items: { type: 'string' } },
    bulletProposals: {
      type: 'array', items: {
        type: 'object', additionalProperties: false,
        properties: {
          sectionType: { type: 'string', enum: ['experience', 'project'] },
          itemIndex: { type: 'integer' }, bulletIndex: { type: 'integer' },
          ...proposalProperties,
        },
        required: ['sectionType', 'itemIndex', 'bulletIndex', 'originalText', 'proposedText', 'rationale', 'evidenceRefs'],
      },
    },
    warnings: { type: 'array', items: { type: 'string' } },
  },
  required: ['summaryProposal', 'skillOrder', 'bulletProposals', 'warnings'],
};
