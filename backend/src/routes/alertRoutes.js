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

// Obtener todas las alertas (todos los roles)
router.get('/', authenticateToken, authorize('admin', 'operator', 'viewer'), async (req, res) => {
  try {
    const alerts = await executeQuery('SELECT * FROM alerts WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 50');

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener alerta por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const alerts = await executeQuery(`
      SELECT 
        a.*,
        d.license_number,
        CONCAT(d.first_name, ' ', d.last_name) as driver_name,
        v.plate_number,
        CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_description,
        e.event_type,
        e.confidence,
        e.image_path
      FROM alerts a
      LEFT JOIN drivers d ON a.driver_id = d.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN events e ON a.event_id = e.id
      WHERE a.id = ? AND a.deleted_at IS NULL
    `, [id]);

    if (alerts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    res.json({
      success: true,
      data: alerts[0]
    });
  } catch (error) {
    console.error('Error al obtener alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nueva alerta
router.post('/', [
  body('event_id').isInt().withMessage('ID del evento es requerido'),
  body('driver_id').isInt().withMessage('ID del conductor es requerido'),
  body('alert_type').isIn(['drowsiness_warning', 'drowsiness_critical', 'distraction_warning', 'system_alert', 'maintenance_reminder']).withMessage('Tipo de alerta inválido'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Severidad inválida'),
  body('title').notEmpty().withMessage('Título es requerido'),
  body('message').notEmpty().withMessage('Mensaje es requerido'),
  body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Prioridad debe estar entre 1 y 5'),
  validateErrors
], async (req, res) => {
  try {
    const {
      event_id,
      driver_id,
      vehicle_id,
      alert_type,
      severity,
      title,
      message,
      priority = 1,
      metadata
    } = req.body;

    // Verificar si el evento existe
    const event = await executeQuery(
      'SELECT id FROM events WHERE id = ? AND deleted_at IS NULL',
      [event_id]
    );

    if (event.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Verificar si el conductor existe
    const driver = await executeQuery(
      'SELECT id FROM drivers WHERE id = ? AND deleted_at IS NULL',
      [driver_id]
    );

    if (driver.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Conductor no encontrado'
      });
    }

    // Verificar si el vehículo existe (si se proporciona)
    if (vehicle_id) {
      const vehicle = await executeQuery(
        'SELECT id FROM vehicles WHERE id = ? AND deleted_at IS NULL',
        [vehicle_id]
      );

      if (vehicle.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Vehículo no encontrado'
        });
      }
    }

    const result = await executeQuery(`
      INSERT INTO alerts (
        event_id, driver_id, vehicle_id, alert_type, severity,
        title, message, priority, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      event_id, driver_id, vehicle_id || null, alert_type, severity,
      title, message, priority,
      metadata ? JSON.stringify(metadata) : null
    ]);

    res.status(201).json({
      success: true,
      message: 'Alerta creada exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al crear alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar estado de alerta
router.put('/:id/status', [
  body('status').isIn(['pending', 'sent', 'delivered', 'read', 'acknowledged', 'dismissed']).withMessage('Estado inválido'),
  body('response').optional().isString().withMessage('Respuesta debe ser texto'),
  validateErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    // Verificar si la alerta existe
    const existing = await executeQuery(
      'SELECT id FROM alerts WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    const updateFields = ['status = ?'];
    const values = [status];

    // Actualizar timestamps según el estado
    switch (status) {
      case 'sent':
        updateFields.push('sent_at = CURRENT_TIMESTAMP');
        break;
      case 'delivered':
        updateFields.push('delivered_at = CURRENT_TIMESTAMP');
        break;
      case 'read':
        updateFields.push('read_at = CURRENT_TIMESTAMP');
        break;
      case 'acknowledged':
        updateFields.push('acknowledged_at = CURRENT_TIMESTAMP');
        if (response) {
          updateFields.push('response = ?');
          values.push(response);
        }
        break;
    }

    values.push(id);

    await executeQuery(`
      UPDATE alerts 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, values);

    res.json({
      success: true,
      message: 'Estado de alerta actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar estado de alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener alertas pendientes
router.get('/pending/list', async (req, res) => {
  try {
    const alerts = await executeQuery(`
      SELECT 
        a.*,
        d.license_number,
        CONCAT(d.first_name, ' ', d.last_name) as driver_name,
        v.plate_number,
        CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_description,
        e.event_type,
        e.confidence
      FROM alerts a
      LEFT JOIN drivers d ON a.driver_id = d.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN events e ON a.event_id = e.id
      WHERE a.status = 'pending' AND a.deleted_at IS NULL
      ORDER BY a.priority DESC, a.created_at ASC
    `);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error al obtener alertas pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener alertas críticas (últimas 24 horas)
router.get('/critical/24h', async (req, res) => {
  try {
    const alerts = await executeQuery(`
      SELECT 
        a.*,
        d.license_number,
        CONCAT(d.first_name, ' ', d.last_name) as driver_name,
        v.plate_number,
        CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_description,
        e.event_type,
        e.confidence
      FROM alerts a
      LEFT JOIN drivers d ON a.driver_id = d.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN events e ON a.event_id = e.id
      WHERE a.severity = 'critical' 
        AND a.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        AND a.deleted_at IS NULL
      ORDER BY a.created_at DESC
    `);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error al obtener alertas críticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de alertas
router.get('/stats/summary', async (req, res) => {
  try {
    const { start_date, end_date, driver_id, vehicle_id } = req.query;

    let whereConditions = ['a.deleted_at IS NULL'];
    let params = [];

    if (driver_id) {
      whereConditions.push('a.driver_id = ?');
      params.push(driver_id);
    }

    if (vehicle_id) {
      whereConditions.push('a.vehicle_id = ?');
      params.push(vehicle_id);
    }

    if (start_date && end_date) {
      whereConditions.push('a.created_at BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }

    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN a.severity = 'critical' THEN 1 END) as critical_alerts,
        COUNT(CASE WHEN a.severity = 'high' THEN 1 END) as high_alerts,
        COUNT(CASE WHEN a.severity = 'medium' THEN 1 END) as medium_alerts,
        COUNT(CASE WHEN a.severity = 'low' THEN 1 END) as low_alerts,
        COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_alerts,
        COUNT(CASE WHEN a.status = 'acknowledged' THEN 1 END) as acknowledged_alerts,
        COUNT(CASE WHEN a.alert_type = 'drowsiness_warning' THEN 1 END) as drowsiness_warnings,
        COUNT(CASE WHEN a.alert_type = 'drowsiness_critical' THEN 1 END) as drowsiness_critical,
        COUNT(CASE WHEN a.alert_type = 'distraction_warning' THEN 1 END) as distraction_warnings,
        AVG(a.priority) as avg_priority,
        MAX(a.created_at) as last_alert,
        MIN(a.created_at) as first_alert
      FROM alerts a
      WHERE ${whereConditions.join(' AND ')}
    `, params);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar alerta (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery(
      'UPDATE alerts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Alerta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
