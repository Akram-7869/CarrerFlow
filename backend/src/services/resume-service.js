import path from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  createResume, deleteResume as deleteResumeRecord, findResumeByHash, findResumeById,
  listResumes as listResumeRecords, updateResume,
} from '../repositories/resume-repository.js';
import { AppError } from '../utils/app-error.js';
import { extractDocumentText } from './document-parser-service.js';
import {
  calculateFileHash, inspectResumeFile, removeStoredFile, resolveStoredFile, storeResumeFile,
} from './file-storage-service.js';
import { extractResumeStructure } from './gemini-service.js';
import { saveProfile } from './profile-service.js';
import { profileDataSchema } from '../validators/profile-validator.js';

const presentResume = (resume, includeDetails = false) => ({
  id: resume.id,
  name: resume.name,
  originalFilename: resume.original_filename,
  mimeType: resume.mime_type,
  fileSize: resume.file_size,
  status: resume.status,
  extractionModel: resume.extraction_model,
  extractionVersion: resume.extraction_version,
  extractionError: resume.extraction_error,
  structuredData: resume.structured_data,
  ...(includeDetails && { parsedText: resume.parsed_text }),
  createdAt: resume.created_at,
  updatedAt: resume.updated_at,
});

const requireResume = async (resumeId, userId) => {
  const resume = await findResumeById(resumeId, userId);
  if (!resume) throw new AppError(404, 'RESUME_NOT_FOUND', 'Resume not found.');
  return resume;
};

const runExtraction = async (resume, buffer) => {
  await updateResume(resume.id, resume.user_id, { status: 'parsing', extraction_error: null });

  try {
    const parsedText = resume.parsed_text || await extractDocumentText(buffer, resume.mime_type);
    const extraction = await extractResumeStructure(parsedText);
    const updated = await updateResume(resume.id, resume.user_id, {
      status: 'review_required',
      parsed_text: parsedText,
      structured_data: JSON.stringify(extraction.profile),
      extraction_model: extraction.model,
      extraction_version: extraction.version,
      extraction_error: null,
    });
    return presentResume(updated, true);
  } catch (error) {
    await updateResume(resume.id, resume.user_id, {
      status: 'failed',
      extraction_error: error.message,
    });
    if (error instanceof AppError) {
      error.details = { ...(error.details || {}), resumeId: resume.id };
    }
    throw error;
  }
};

export const uploadAndExtractResume = async (userId, file) => {
  const detected = await inspectResumeFile(file.buffer);
  const fileHash = calculateFileHash(file.buffer);
  const duplicate = await findResumeByHash(fileHash, userId);
  if (duplicate) {
    throw new AppError(409, 'DUPLICATE_RESUME', 'This resume has already been uploaded.', {
      resumeId: duplicate.id,
    });
  }

  const stored = await storeResumeFile({ userId, buffer: file.buffer, extension: detected.extension });
  let resume;
  try {
    resume = await createResume({
      user_id: userId,
      name: path.basename(file.originalname, path.extname(file.originalname)).slice(0, 150) || 'Resume',
      original_filename: path.basename(file.originalname).slice(0, 255),
      stored_filename: stored.storedFilename,
      file_path: stored.relativePath,
      mime_type: detected.mimeType,
      file_size: file.size,
      file_hash: fileHash,
      status: 'uploaded',
    });
  } catch (error) {
    await removeStoredFile(stored.relativePath);
    throw error;
  }

  return runExtraction({ ...resume, user_id: userId, mime_type: detected.mimeType }, file.buffer);
};

export const retryExtraction = async (resumeId, userId) => {
  const resume = await requireResume(resumeId, userId);
  const buffer = resume.parsed_text ? null : await readFile(resolveStoredFile(resume.file_path));
  return runExtraction(resume, buffer);
};

export const listResumes = async (userId) => (await listResumeRecords(userId)).map((item) => presentResume(item));

export const getResume = async (resumeId, userId) => presentResume(await requireResume(resumeId, userId), true);

export const renameResume = async (resumeId, userId, name) => {
  await requireResume(resumeId, userId);
  return presentResume(await updateResume(resumeId, userId, { name }));
};

export const removeResume = async (resumeId, userId) => {
  const resume = await requireResume(resumeId, userId);
  await deleteResumeRecord(resumeId, userId);
  await removeStoredFile(resume.file_path);
};

export const getResumeDownload = async (resumeId, userId) => {
  const resume = await requireResume(resumeId, userId);
  return { path: resolveStoredFile(resume.file_path), filename: resume.original_filename };
};

export const confirmResumeProfile = async (resumeId, userId, rawProfile) => {
  const resume = await requireResume(resumeId, userId);
  if (!['review_required', 'confirmed'].includes(resume.status)) {
    throw new AppError(409, 'RESUME_NOT_READY', 'This resume is not ready for confirmation.');
  }
  const profile = profileDataSchema.parse(rawProfile);
  return saveProfile(userId, profile, resumeId);
};
