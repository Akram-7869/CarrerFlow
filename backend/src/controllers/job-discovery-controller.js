import * as discoveryService from '../services/job-discovery-service.js';

export const preferences = async (request, response) => {
  response.json({ data: { preferences: await discoveryService.getPreferences(request.user.id) } });
};

export const savePreferences = async (request, response) => {
  response.json({ data: { preferences: await discoveryService.updatePreferences(request.user.id, request.validated.body) } });
};

export const search = async (request, response) => {
  response.json({ data: await discoveryService.discoverJobs(request.user.id, request.validated.body) });
};
