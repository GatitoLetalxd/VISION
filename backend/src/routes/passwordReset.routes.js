const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordReset.controller');

// Ruta para solicitar recuperación de contraseña
router.post('/request-reset', passwordResetController.requestReset);

// Ruta para restablecer la contraseña
router.post('/reset', passwordResetController.resetPassword);

module.exports = router; 