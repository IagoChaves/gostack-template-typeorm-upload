import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const TmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: TmpFolder,
  storage: multer.diskStorage({
    destination: TmpFolder,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('HEX');
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};
