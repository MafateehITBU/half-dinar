import multer from 'multer';
import { AppError, ErrorCodes } from '../../shared/errors.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(
        new AppError(
          400,
          ErrorCodes.VALIDATION_ERROR,
          'Only JPEG, PNG, WebP, or GIF images are allowed',
        ) as unknown as Error,
      );
      return;
    }
    cb(null, true);
  },
});
