import * as copilotService from '../services/copilot-service.js';

export const ask = async (request, response) => {
  const result = await copilotService.askCareerCopilot(request.user.id, request.validated.body.question);
  response.json({ data: { result } });
};
