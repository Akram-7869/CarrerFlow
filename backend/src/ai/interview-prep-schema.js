const question = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    question: { type: 'string' },
    whyItMatters: { type: 'string' },
    strongAnswerSignals: { type: 'array', items: { type: 'string' } },
    evidenceRefs: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'question', 'whyItMatters', 'strongAnswerSignals', 'evidenceRefs'],
};

export const interviewPrepJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    overview: { type: 'string' },
    categories: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          key: { type: 'string' },
          title: { type: 'string' },
          focus: { type: 'string' },
          questions: { type: 'array', items: question },
        },
        required: ['key', 'title', 'focus', 'questions'],
      },
    },
    studyPlan: { type: 'array', items: { type: 'string' } },
    warnings: { type: 'array', items: { type: 'string' } },
  },
  required: ['overview', 'categories', 'studyPlan', 'warnings'],
};
