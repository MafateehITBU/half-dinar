import multer from 'multer';
import { AppError, ErrorCodes } from '../../shared/errors.js';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Only image files allowed') as unknown as Error);
      return;
    }
    cb(null, true);
  },
});
