const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middlewares/auth');
const videoProcessingController = require('../controllers/videoProcessingController');

const router = express.Router();

const TEMP_UPLOAD_DIR = path.join(__dirname, '../../uploads/tmp');
fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname) || '.mp4';
    cb(null, `${uniqueSuffix}${extension.toLowerCase()}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('video/')) {
    return cb(new Error('Solo se permiten archivos de video'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1 GB
  },
});

router.post('/upload', authenticateToken, upload.single('video'), videoProcessingController.uploadVideo);
router.post('/analyze', authenticateToken, videoProcessingController.startAnalysis);
router.get('/analysis', authenticateToken, videoProcessingController.listAnalyses);
router.get('/analysis/:videoId', authenticateToken, videoProcessingController.getAnalysis);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Error de carga de archivo: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'Error al procesar el archivo de video' });
  }
  return next();
});

module.exports = router;
