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

// Obtener todos los vehículos
router.get('/', async (req, res) => {
  try {
    const vehicles = await executeQuery(`
      SELECT 
        v.*,
        COUNT(e.id) as total_events,
        COUNT(CASE WHEN e.severity = 'critical' THEN 1 END) as critical_events,
        MAX(e.timestamp) as last_event,
        CASE 
          WHEN v.next_maintenance IS NULL THEN 'N/A'
          WHEN v.next_maintenance <= NOW() THEN 'Overdue'
          WHEN v.next_maintenance <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'Due Soon'
          ELSE 'OK'
        END as maintenance_status
      FROM vehicles v
      LEFT JOIN events e ON v.id = e.vehicle_id
      WHERE v.deleted_at IS NULL
      GROUP BY v.id
      ORDER BY v.created_at DESC
    `);

    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener vehículo por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicles = await executeQuery(`
      SELECT 
        v.*,
        COUNT(e.id) as total_events,
        COUNT(CASE WHEN e.severity = 'critical' THEN 1 END) as critical_events,
        COUNT(CASE WHEN e.severity = 'high' THEN 1 END) as high_events,
        MAX(e.timestamp) as last_event,
        CASE 
          WHEN v.next_maintenance IS NULL THEN 'N/A'
          WHEN v.next_maintenance <= NOW() THEN 'Overdue'
          WHEN v.next_maintenance <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'Due Soon'
          ELSE 'OK'
        END as maintenance_status
      FROM vehicles v
      LEFT JOIN events e ON v.id = e.vehicle_id
      WHERE v.id = ? AND v.deleted_at IS NULL
      GROUP BY v.id
    `, [id]);

    if (vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado'
      });
    }

    res.json({
      success: true,
      data: vehicles[0]
    });
  } catch (error) {
    console.error('Error al obtener vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo vehículo
router.post('/', [
  body('plate_number').notEmpty().withMessage('Número de placa es requerido'),
  body('make').notEmpty().withMessage('Marca es requerida'),
  body('model').notEmpty().withMessage('Modelo es requerido'),
  body('year').isInt({ min: 1900, max: 2030 }).withMessage('Año debe estar entre 1900 y 2030'),
  body('vehicle_type').isIn(['bus', 'truck', 'van', 'car', 'motorcycle']).withMessage('Tipo de vehículo inválido'),
  body('capacity').optional().isInt({ min: 1, max: 100 }).withMessage('Capacidad debe estar entre 1 y 100'),
  validateErrors
], async (req, res) => {
  try {
    const {
      plate_number,
      make,
      model,
      year,
      color,
      vehicle_type = 'car',
      capacity,
      last_maintenance,
      next_maintenance,
      insurance_expiry,
      registration_expiry,
      notes
    } = req.body;

    // Verificar si la placa ya existe
    const existing = await executeQuery(
      'SELECT id FROM vehicles WHERE plate_number = ? AND deleted_at IS NULL',
      [plate_number]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El número de placa ya está registrado'
      });
    }

    const result = await executeQuery(`
      INSERT INTO vehicles (
        plate_number, make, model, year, color, vehicle_type,
        capacity, last_maintenance, next_maintenance,
        insurance_expiry, registration_expiry, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      plate_number, make, model, year, color || null, vehicle_type,
      capacity || null, last_maintenance || null, next_maintenance || null,
      insurance_expiry || null, registration_expiry || null, notes || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Vehículo creado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al crear vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar vehículo
router.put('/:id', [
  body('make').optional().notEmpty().withMessage('Marca no puede estar vacía'),
  body('model').optional().notEmpty().withMessage('Modelo no puede estar vacío'),
  body('year').optional().isInt({ min: 1900, max: 2030 }).withMessage('Año debe estar entre 1900 y 2030'),
  body('vehicle_type').optional().isIn(['bus', 'truck', 'van', 'car', 'motorcycle']).withMessage('Tipo de vehículo inválido'),
  body('capacity').optional().isInt({ min: 1, max: 100 }).withMessage('Capacidad debe estar entre 1 y 100'),
  validateErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar si el vehículo existe
    const existing = await executeQuery(
      'SELECT id FROM vehicles WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado'
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
      UPDATE vehicles 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, values);

    res.json({
      success: true,
      message: 'Vehículo actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar vehículo (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery(
      'UPDATE vehicles SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Vehículo eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener vehículos que necesitan mantenimiento
router.get('/maintenance/due', async (req, res) => {
  try {
    const vehicles = await executeQuery(`
      SELECT 
        v.*,
        CASE 
          WHEN v.next_maintenance <= NOW() THEN 'Overdue'
          WHEN v.next_maintenance <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'Due Soon'
          ELSE 'OK'
        END as maintenance_status,
        DATEDIFF(v.next_maintenance, NOW()) as days_until_maintenance
      FROM vehicles v
      WHERE v.deleted_at IS NULL 
        AND v.next_maintenance IS NOT NULL
        AND v.next_maintenance <= DATE_ADD(NOW(), INTERVAL 30 DAY)
      ORDER BY v.next_maintenance ASC
    `);

    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Error al obtener vehículos con mantenimiento pendiente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar mantenimiento de vehículo
router.put('/:id/maintenance', [
  body('last_maintenance').optional().isISO8601().withMessage('Fecha de último mantenimiento inválida'),
  body('next_maintenance').optional().isISO8601().withMessage('Fecha de próximo mantenimiento inválida'),
  validateErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { last_maintenance, next_maintenance, notes } = req.body;

    // Verificar si el vehículo existe
    const existing = await executeQuery(
      'SELECT id FROM vehicles WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado'
      });
    }

    const updateFields = [];
    const values = [];

    if (last_maintenance) {
      updateFields.push('last_maintenance = ?');
      values.push(last_maintenance);
    }

    if (next_maintenance) {
      updateFields.push('next_maintenance = ?');
      values.push(next_maintenance);
    }

    if (notes) {
      updateFields.push('notes = ?');
      values.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay datos de mantenimiento para actualizar'
      });
    }

    values.push(id);

    await executeQuery(`
      UPDATE vehicles 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, values);

    res.json({
      success: true,
      message: 'Mantenimiento actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar mantenimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
