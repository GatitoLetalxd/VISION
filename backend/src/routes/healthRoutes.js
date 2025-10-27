const express = require('express');
const router = express.Router();
const { testConnection } = require('../config/database');

// Ruta básica de health check
router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ruta para verificar la conexión a la base de datos
router.get('/db', async (req, res) => {
  try {
    await testConnection();
    res.json({
      status: 'OK',
      message: 'Conexión a la base de datos establecida correctamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al conectar con la base de datos',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 