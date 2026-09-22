import * as profileService from '../services/profile-service.js';

export const get = async (request, response) => {
  response.json({ data: { profile: await profileService.fetchProfile(request.user.id) } });
};

export const save = async (request, response) => {
  const { profile, resumeId } = request.validated.body;
  const saved = await profileService.saveProfile(request.user.id, profile, resumeId || null);
  response.json({ data: { profile: saved } });
};
