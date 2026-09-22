import { getProfile, replaceProfile } from '../repositories/profile-repository.js';
import { findResumeById, updateResume } from '../repositories/resume-repository.js';
import { AppError } from '../utils/app-error.js';
import { profileDataSchema } from '../validators/profile-validator.js';

export const fetchProfile = (userId) => getProfile(userId);

export const saveProfile = async (userId, rawProfile, resumeId = null) => {
  const profile = profileDataSchema.parse(rawProfile);

  if (resumeId) {
    const resume = await findResumeById(resumeId, userId);
    if (!resume) throw new AppError(404, 'RESUME_NOT_FOUND', 'Resume not found.');
  }

  await replaceProfile(userId, profile, resumeId);
  if (resumeId) await updateResume(resumeId, userId, { status: 'confirmed' });
  return getProfile(userId);
};
