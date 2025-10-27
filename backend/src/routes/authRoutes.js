const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

// Rutas de autenticación
router.post('/register', AuthController.register);
router.post('/signup', AuthController.register); // Ruta alternativa para evitar bloqueos
router.post('/login', AuthController.login);
router.post('/signin', AuthController.login); // Ruta alternativa
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

module.exports = router; 