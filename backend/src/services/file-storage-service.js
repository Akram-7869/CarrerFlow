import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { fileTypeFromBuffer } from 'file-type';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
const storageRoot = path.resolve(backendRoot, env.RESUME_STORAGE_PATH);
const allowedTypes = new Map([
  ['application/pdf', 'pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
]);

export const inspectResumeFile = async (buffer) => {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !allowedTypes.has(detected.mime)) {
    throw new AppError(415, 'UNSUPPORTED_FILE_TYPE', 'Only genuine PDF and DOCX files are accepted.');
  }
  return { mimeType: detected.mime, extension: allowedTypes.get(detected.mime) };
};

export const calculateFileHash = (buffer) =>
  crypto.createHash('sha256').update(buffer).digest('hex');

export const storeResumeFile = async ({ userId, buffer, extension }) => {
  const userDirectory = path.join(storageRoot, userId);
  const storedFilename = `${crypto.randomUUID()}.${extension}`;
  const relativePath = path.join(userId, storedFilename);
  await mkdir(userDirectory, { recursive: true, mode: 0o700 });
  await writeFile(path.join(storageRoot, relativePath), buffer, { mode: 0o600 });
  return { storedFilename, relativePath };
};

export const resolveStoredFile = (relativePath) => {
  const resolved = path.resolve(storageRoot, relativePath);
  if (!resolved.startsWith(`${storageRoot}${path.sep}`)) {
    throw new AppError(400, 'INVALID_FILE_PATH', 'The stored file path is invalid.');
  }
  return resolved;
};

export const removeStoredFile = async (relativePath) => {
  try {
    await unlink(resolveStoredFile(relativePath));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
};
