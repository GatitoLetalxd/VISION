/**
 * Controlador para gestion de modelos de deteccion
 */

const { pool } = require('../config/database');

/**
 * Obtener todos los modelos de deteccion disponibles
 */
const getAllModels = async (req, res) => {
  try {
    const [models] = await pool().query(
      `SELECT 
        id,
        model_name,
        is_enabled,
        display_name,
        description,
        processing_location,
        landmarks_count,
        avg_latency_ms,
        requires_gpu,
        max_concurrent_users,
        cost_per_hour,
        created_at,
        updated_at
      FROM detection_model_settings
      WHERE is_enabled = TRUE
      ORDER BY model_name`
    );

    res.json({
      success: true,
      models
    });
  } catch (error) {
    console.error('Error obteniendo modelos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener modelos de deteccion',
      error: error.message
    });
  }
};

/**
 * Obtener modelo especifico por nombre
 */
const getModelByName = async (req, res) => {
  try {
    const { modelName } = req.params;

    const [models] = await pool().query(
      `SELECT * FROM detection_model_settings WHERE model_name = ?`,
      [modelName]
    );

    if (models.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Modelo no encontrado'
      });
    }

    res.json({
      success: true,
      model: models[0]
    });
  } catch (error) {
    console.error('Error obteniendo modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener modelo',
      error: error.message
    });
  }
};

/**
 * Actualizar configuracion de modelo (Solo admin)
 */
const updateModelSettings = async (req, res) => {
  try {
    const { modelName } = req.params;
    const {
      is_enabled,
      display_name,
      description,
      avg_latency_ms,
      max_concurrent_users,
      cost_per_hour
    } = req.body;

    // Construir query dinamicamente
    const updates = [];
    const values = [];

    if (typeof is_enabled !== 'undefined') {
      updates.push('is_enabled = ?');
      values.push(is_enabled);
    }
    if (display_name) {
      updates.push('display_name = ?');
      values.push(display_name);
    }
    if (description) {
      updates.push('description = ?');
      values.push(description);
    }
    if (avg_latency_ms) {
      updates.push('avg_latency_ms = ?');
      values.push(avg_latency_ms);
    }
    if (max_concurrent_users) {
      updates.push('max_concurrent_users = ?');
      values.push(max_concurrent_users);
    }
    if (typeof cost_per_hour !== 'undefined') {
      updates.push('cost_per_hour = ?');
      values.push(cost_per_hour);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    values.push(modelName);

    await pool().query(
      `UPDATE detection_model_settings 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE model_name = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Configuracion de modelo actualizada'
    });
  } catch (error) {
    console.error('Error actualizando modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar modelo',
      error: error.message
    });
  }
};

/**
 * Obtener preferencia de modelo del usuario actual
 */
const getUserPreference = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    console.log('Obteniendo preferencia para usuario:', userId);

    const [users] = await pool().query(
      `SELECT preferred_detection_model FROM users WHERE id = ?`,
      [userId]
    );

    console.log('Resultado query users:', users);

    if (users.length === 0) {
      console.log('Usuario no encontrado con ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('Preferencia encontrada:', users[0].preferred_detection_model);

    res.json({
      success: true,
      preferred_model: users[0].preferred_detection_model
    });
  } catch (error) {
    console.error('Error obteniendo preferencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener preferencia',
      error: error.message
    });
  }
};

/**
 * Actualizar preferencia de modelo del usuario
 */
const updateUserPreference = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { preferred_model } = req.body;

    // Validar modelo
    if (!['face-api', 'mediapipe'].includes(preferred_model)) {
      return res.status(400).json({
        success: false,
        message: 'Modelo invalido. Use: face-api o mediapipe'
      });
    }

    // Verificar que el modelo este habilitado
    const [models] = await pool().query(
      `SELECT is_enabled FROM detection_model_settings WHERE model_name = ?`,
      [preferred_model]
    );

    if (models.length === 0 || !models[0].is_enabled) {
      return res.status(400).json({
        success: false,
        message: 'El modelo seleccionado no esta disponible'
      });
    }

    await pool().query(
      `UPDATE users SET preferred_detection_model = ? WHERE id = ?`,
      [preferred_model, userId]
    );

    res.json({
      success: true,
      message: 'Preferencia de modelo actualizada',
      preferred_model
    });
  } catch (error) {
    console.error('Error actualizando preferencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar preferencia',
      error: error.message
    });
  }
};

/**
 * Crear sesion de deteccion
 */
const createSession = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { driver_id, vehicle_id, detection_model } = req.body;

    if (!driver_id || !detection_model) {
      return res.status(400).json({
        success: false,
        message: 'driver_id y detection_model son requeridos'
      });
    }

    // Usar la estructura de la tabla existente
    const notes = JSON.stringify({
      detection_model,
      user_id: userId,
      started_by: req.user.email
    });

    const [result] = await pool().query(
      `INSERT INTO detection_sessions 
       (driver_id, vehicle_id, session_start, notes) 
       VALUES (?, ?, CURRENT_TIMESTAMP, ?)`,
      [driver_id, vehicle_id, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Sesion de deteccion creada',
      session_id: result.insertId,
      detection_model
    });
  } catch (error) {
    console.error('Error creando sesion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear sesion',
      error: error.message
    });
  }
};

/**
 * Finalizar sesion de deteccion
 */
const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { total_frames, total_events, avg_confidence, avg_latency, notes } = req.body;

    // Construir objeto de notas con la información de la sesión
    const sessionNotes = JSON.stringify({
      total_frames,
      avg_confidence,
      avg_latency,
      user_notes: notes
    });

    // Usar columnas de la tabla existente
    await pool().query(
      `UPDATE detection_sessions 
       SET session_end = CURRENT_TIMESTAMP,
           total_events = COALESCE(?, total_events),
           average_confidence = COALESCE(?, average_confidence),
           notes = COALESCE(?, notes)
       WHERE id = ?`,
      [total_events, avg_confidence, sessionNotes, sessionId]
    );

    res.json({
      success: true,
      message: 'Sesion finalizada'
    });
  } catch (error) {
    console.error('Error finalizando sesion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al finalizar sesion',
      error: error.message
    });
  }
};

/**
 * Obtener estadisticas de uso de modelos
 */
const getModelStatistics = async (req, res) => {
  try {
    // Extraer detection_model de las notas JSON
    const [stats] = await pool().query(`
      SELECT 
        JSON_UNQUOTE(JSON_EXTRACT(notes, '$.detection_model')) as detection_model,
        COUNT(*) as total_sessions,
        SUM(total_events) as total_events,
        AVG(average_confidence) as avg_confidence,
        AVG(TIMESTAMPDIFF(MINUTE, session_start, session_end)) as avg_duration_minutes
      FROM detection_sessions
      WHERE session_end IS NOT NULL
        AND notes IS NOT NULL
        AND JSON_VALID(notes)
        AND JSON_EXTRACT(notes, '$.detection_model') IS NOT NULL
      GROUP BY JSON_UNQUOTE(JSON_EXTRACT(notes, '$.detection_model'))
    `);

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadisticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadisticas',
      error: error.message
    });
  }
};

module.exports = {
  getAllModels,
  getModelByName,
  updateModelSettings,
  getUserPreference,
  updateUserPreference,
  createSession,
  endSession,
  getModelStatistics
};

