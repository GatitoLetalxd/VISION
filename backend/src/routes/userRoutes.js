const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const UserController = require('../controllers/userController');
const FriendController = require('../controllers/friendController');
const { authenticateToken } = require('../middlewares/auth');
const fs = require('fs');

// Configuración de multer para subida de fotos de perfil
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Directorio temporal - el controlador moverá el archivo al directorio final
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
      if (err) {
        console.error('Error al crear directorio temporal:', err);
      }
      cb(null, uploadDir);
    });
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'temp-profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // Límite de 2MB para fotos de perfil
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png)'));
  }
});

// Rutas protegidas - requieren autenticación
router.get('/profile', authenticateToken, (req, res) => UserController.getProfile(req, res));
router.put('/profile', authenticateToken, (req, res) => UserController.updateProfile(req, res));
router.get('/list', authenticateToken, (req, res) => UserController.getAllUsers(req, res));
router.post('/profile/photo', authenticateToken, upload.single('photo'), (req, res) => UserController.updateProfilePhoto(req, res));

// Rutas de gestión de usuarios (solo admin)
router.put('/:userId/role', authenticateToken, (req, res) => UserController.updateUserRole(req, res));
router.put('/:userId/status', authenticateToken, (req, res) => UserController.toggleUserStatus(req, res));
router.delete('/:userId', authenticateToken, (req, res) => UserController.deleteUser(req, res));

// Rutas de amigos
router.get('/search', authenticateToken, (req, res) => FriendController.searchUsers(req, res));
router.get('/friends', authenticateToken, (req, res) => FriendController.getFriends(req, res));
router.get('/friends/pending', authenticateToken, (req, res) => FriendController.getPendingRequests(req, res));
router.post('/friends/request/:friendId', authenticateToken, (req, res) => FriendController.sendFriendRequest(req, res));
router.post('/friends/accept/:friendId', authenticateToken, (req, res) => FriendController.acceptFriendRequest(req, res));
router.post('/friends/reject/:friendId', authenticateToken, (req, res) => FriendController.rejectFriendRequest(req, res));

module.exports = router; 