import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_RESUME_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});

export const uploadResume = (request, response, next) => {
  uploader.single('resume')(request, response, (error) => {
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(413, 'FILE_TOO_LARGE', `Resume files must be ${env.MAX_RESUME_SIZE_MB} MB or smaller.`));
    }
    if (error) return next(new AppError(400, 'UPLOAD_FAILED', error.message));
    if (!request.file) return next(new AppError(400, 'FILE_REQUIRED', 'Select a PDF or DOCX resume to upload.'));
    return next();
  });
};
