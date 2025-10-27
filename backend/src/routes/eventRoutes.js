const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');

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

// Obtener todos los eventos
router.get('/', async (req, res) => {
  try {
    const events = await executeQuery('SELECT * FROM events WHERE deleted_at IS NULL ORDER BY timestamp DESC LIMIT 50');

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener evento por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const events = await executeQuery(`
      SELECT 
        e.*,
        d.license_number,
        CONCAT(d.first_name, ' ', d.last_name) as driver_name,
        v.plate_number,
        CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_description
      FROM events e
      LEFT JOIN drivers d ON e.driver_id = d.id
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      WHERE e.id = ? AND e.deleted_at IS NULL
    `, [id]);

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      data: events[0]
    });
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo evento (usado por el servicio de visión)
router.post('/', [
  body('driver_id').isInt().withMessage('ID del conductor es requerido'),
  body('event_type').isIn(['eye_closed', 'head_nodding', 'yawning', 'blinking_slow', 'distraction', 'normal']).withMessage('Tipo de evento inválido'),
  body('confidence').isFloat({ min: 0, max: 1 }).withMessage('Confianza debe estar entre 0 y 1'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Severidad inválida'),
  validateErrors
], async (req, res) => {
  try {
    const {
      driver_id,
      vehicle_id,
      event_type,
      confidence,
      severity,
      location,
      image_path,
      metadata
    } = req.body;

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
      INSERT INTO events (
        driver_id, vehicle_id, event_type, confidence, severity,
        location, image_path, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      driver_id, vehicle_id || null, event_type, confidence, severity,
      location ? JSON.stringify(location) : null,
      image_path || null,
      metadata ? JSON.stringify(metadata) : null
    ]);

    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Marcar evento como procesado
router.put('/:id/process', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery(`
      UPDATE events 
      SET is_processed = TRUE, processed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Evento marcado como procesado'
    });
  } catch (error) {
    console.error('Error al procesar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de eventos
router.get('/stats/summary', async (req, res) => {
  try {
    const { start_date, end_date, driver_id, vehicle_id } = req.query;

    let whereConditions = ['e.deleted_at IS NULL'];
    let params = [];

    if (driver_id) {
      whereConditions.push('e.driver_id = ?');
      params.push(driver_id);
    }

    if (vehicle_id) {
      whereConditions.push('e.vehicle_id = ?');
      params.push(vehicle_id);
    }

    if (start_date && end_date) {
      whereConditions.push('e.timestamp BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }

    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN e.severity = 'critical' THEN 1 END) as critical_events,
        COUNT(CASE WHEN e.severity = 'high' THEN 1 END) as high_events,
        COUNT(CASE WHEN e.severity = 'medium' THEN 1 END) as medium_events,
        COUNT(CASE WHEN e.severity = 'low' THEN 1 END) as low_events,
        COUNT(CASE WHEN e.event_type = 'eye_closed' THEN 1 END) as eye_closed_events,
        COUNT(CASE WHEN e.event_type = 'head_nodding' THEN 1 END) as head_nodding_events,
        COUNT(CASE WHEN e.event_type = 'yawning' THEN 1 END) as yawning_events,
        COUNT(CASE WHEN e.event_type = 'blinking_slow' THEN 1 END) as blinking_slow_events,
        COUNT(CASE WHEN e.event_type = 'distraction' THEN 1 END) as distraction_events,
        AVG(e.confidence) as avg_confidence,
        MAX(e.timestamp) as last_event,
        MIN(e.timestamp) as first_event
      FROM events e
      WHERE ${whereConditions.join(' AND ')}
    `, params);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener eventos recientes (últimas 24 horas)
router.get('/recent/24h', async (req, res) => {
  try {
    const events = await executeQuery(`
      SELECT 
        e.*,
        d.license_number,
        CONCAT(d.first_name, ' ', d.last_name) as driver_name,
        v.plate_number,
        CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_description
      FROM events e
      LEFT JOIN drivers d ON e.driver_id = d.id
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      WHERE e.deleted_at IS NULL 
        AND e.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY e.timestamp DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error al obtener eventos recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar evento (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery(
      'UPDATE events SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
