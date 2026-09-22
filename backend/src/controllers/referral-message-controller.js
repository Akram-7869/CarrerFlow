import * as messageService from '../services/referral-message-service.js';

export const create = async (request, response) => {
  const message = await messageService.generateMessage(request.user.id, request.validated.params.candidateId, request.validated.body);
  response.status(201).json({ data: { message } });
};

export const list = async (request, response) => {
  response.json({ data: { messages: await messageService.getMessages(request.user.id, request.validated.params.candidateId) } });
};

export const update = async (request, response) => {
  const message = await messageService.editMessage(request.user.id, request.validated.params.messageId, request.validated.body.message);
  response.json({ data: { message } });
};

export const remove = async (request, response) => {
  await messageService.removeMessage(request.user.id, request.validated.params.messageId);
  response.status(204).send();
};
