/**
 * Rutas para gestion de modelos de deteccion
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const {
  getAllModels,
  getModelByName,
  updateModelSettings,
  getUserPreference,
  updateUserPreference,
  createSession,
  endSession,
  getModelStatistics
} = require('../controllers/detectionModelController');

// Obtener todos los modelos disponibles (todos los roles incluyendo drivers)
router.get(
  '/models',
  authenticateToken,
  authorize('admin', 'operator', 'viewer', 'driver'),
  getAllModels
);

// Obtener modelo especifico (todos los roles incluyendo drivers)
router.get(
  '/models/:modelName',
  authenticateToken,
  authorize('admin', 'operator', 'viewer', 'driver'),
  getModelByName
);

// Actualizar configuracion de modelo (solo admin)
router.put(
  '/models/:modelName',
  authenticateToken,
  authorize('admin'),
  updateModelSettings
);

// Obtener preferencia del usuario (todos los usuarios autenticados, incluyendo drivers)
router.get(
  '/preference',
  authenticateToken,
  getUserPreference
);

// Actualizar preferencia del usuario (todos los usuarios autenticados, incluyendo drivers)
router.put(
  '/preference',
  authenticateToken,
  updateUserPreference
);

// Crear sesion de deteccion (incluyendo drivers)
router.post(
  '/sessions',
  authenticateToken,
  authorize('admin', 'operator', 'driver'),
  createSession
);

// Finalizar sesion de deteccion (incluyendo drivers)
router.put(
  '/sessions/:sessionId/end',
  authenticateToken,
  authorize('admin', 'operator', 'driver'),
  endSession
);

// Obtener estadisticas de uso (solo admin)
router.get(
  '/statistics',
  authenticateToken,
  authorize('admin'),
  getModelStatistics
);

module.exports = router;

