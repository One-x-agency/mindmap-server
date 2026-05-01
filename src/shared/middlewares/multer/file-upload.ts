import multer from 'multer';
import storage from './storage.js';

const upload = multer({
    storage,
    limits: {
        fileSize: 104857600,  // 100MB
        files: 30,
    },
});

export default upload;
