const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

// Middleware para validar errores
const validateErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array()
    });
  }
  next();
};

// Obtener todos los conductores (todos los roles autenticados)
router.get('/', authenticateToken, authorize('admin', 'operator', 'viewer'), async (req, res) => {
  try {
    const drivers = await executeQuery(`
      SELECT 
        d.*,
        COUNT(e.id) as total_events,
        COUNT(CASE WHEN e.severity = 'critical' THEN 1 END) as critical_events,
        MAX(e.timestamp) as last_event
      FROM drivers d
      LEFT JOIN events e ON d.id = e.driver_id
      WHERE d.deleted_at IS NULL
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `);

    res.json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('Error al obtener conductores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener conductor por ID (todos los roles autenticados)
router.get('/:id', authenticateToken, authorize('admin', 'operator', 'viewer'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const drivers = await executeQuery(`
      SELECT 
        d.*,
        COUNT(e.id) as total_events,
        COUNT(CASE WHEN e.severity = 'critical' THEN 1 END) as critical_events,
        COUNT(CASE WHEN e.severity = 'high' THEN 1 END) as high_events,
        AVG(e.confidence) as avg_confidence,
        MAX(e.timestamp) as last_event
      FROM drivers d
      LEFT JOIN events e ON d.id = e.driver_id
      WHERE d.id = ? AND d.deleted_at IS NULL
      GROUP BY d.id
    `, [id]);

    if (drivers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conductor no encontrado'
      });
    }

    res.json({
      success: true,
      data: drivers[0]
    });
  } catch (error) {
    console.error('Error al obtener conductor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo conductor (solo admin)
router.post('/', authenticateToken, authorize('admin'), [
  body('license_number').notEmpty().withMessage('Número de licencia es requerido'),
  body('first_name').notEmpty().withMessage('Nombre es requerido'),
  body('last_name').notEmpty().withMessage('Apellido es requerido'),
  body('date_of_birth').isISO8601().withMessage('Fecha de nacimiento inválida'),
  body('license_expiry').isISO8601().withMessage('Fecha de vencimiento de licencia inválida'),
  body('alert_threshold').optional().isFloat({ min: 0.1, max: 1.0 }).withMessage('Umbral de alerta debe estar entre 0.1 y 1.0'),
  validateErrors
], async (req, res) => {
  try {
    const {
      license_number,
      first_name,
      last_name,
      phone,
      email,
      date_of_birth,
      license_expiry,
      alert_threshold = 0.70,
      emergency_contact,
      emergency_phone,
      notes,
      usuario_id  // ID del usuario a asociar con el conductor
    } = req.body;

    // Verificar si el número de licencia ya existe
    const existing = await executeQuery(
      'SELECT id FROM drivers WHERE license_number = ? AND deleted_at IS NULL',
      [license_number]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El número de licencia ya está registrado'
      });
    }

    // Si se proporciona usuario_id, verificar que el usuario existe
    if (usuario_id) {
      const [users] = await executeQuery(
        'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
        [usuario_id]
      );
      if (users.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El usuario especificado no existe'
        });
      }
    }

    const result = await executeQuery(`
      INSERT INTO drivers (
        license_number, first_name, last_name, phone, email,
        date_of_birth, license_expiry, alert_threshold,
        emergency_contact, emergency_phone, notes, usuario_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      license_number, first_name, last_name, phone || null, email || null,
      date_of_birth, license_expiry, alert_threshold,
      emergency_contact || null, emergency_phone || null, notes || null,
      usuario_id || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Conductor creado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al crear conductor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar conductor (solo admin)
router.put('/:id', authenticateToken, authorize('admin'), [
  body('first_name').optional().notEmpty().withMessage('Nombre no puede estar vacío'),
  body('last_name').optional().notEmpty().withMessage('Apellido no puede estar vacío'),
  body('date_of_birth').optional().isISO8601().withMessage('Fecha de nacimiento inválida'),
  body('license_expiry').optional().isISO8601().withMessage('Fecha de vencimiento de licencia inválida'),
  body('alert_threshold').optional().isFloat({ min: 0.1, max: 1.0 }).withMessage('Umbral de alerta debe estar entre 0.1 y 1.0'),
  validateErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar si el conductor existe
    const existing = await executeQuery(
      'SELECT id FROM drivers WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conductor no encontrado'
      });
    }

    // Construir query de actualización dinámicamente
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay datos para actualizar'
      });
    }

    values.push(id);

    await executeQuery(`
      UPDATE drivers 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, values);

    res.json({
      success: true,
      message: 'Conductor actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar conductor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar conductor (soft delete) - solo admin
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery(
      'UPDATE drivers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conductor no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Conductor eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar conductor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de un conductor (admin y operator)
router.get('/:id/stats', authenticateToken, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    let params = [id];

    if (start_date && end_date) {
      dateFilter = 'AND e.timestamp BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const stats = await executeQuery(`
      SELECT 
        d.license_number,
        CONCAT(d.first_name, ' ', d.last_name) as driver_name,
        COUNT(e.id) as total_events,
        COUNT(CASE WHEN e.severity = 'critical' THEN 1 END) as critical_events,
        COUNT(CASE WHEN e.severity = 'high' THEN 1 END) as high_events,
        COUNT(CASE WHEN e.severity = 'medium' THEN 1 END) as medium_events,
        COUNT(CASE WHEN e.severity = 'low' THEN 1 END) as low_events,
        AVG(e.confidence) as avg_confidence,
        COUNT(a.id) as total_alerts,
        COUNT(CASE WHEN a.status = 'acknowledged' THEN 1 END) as acknowledged_alerts
      FROM drivers d
      LEFT JOIN events e ON d.id = e.driver_id ${dateFilter}
      LEFT JOIN alerts a ON d.id = a.driver_id ${dateFilter}
      WHERE d.id = ? AND d.deleted_at IS NULL
      GROUP BY d.id, d.license_number, d.first_name, d.last_name
    `, params);

    if (stats.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conductor no encontrado'
      });
    }

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del conductor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
