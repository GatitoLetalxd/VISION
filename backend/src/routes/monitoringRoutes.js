const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');

// Endpoint para emitir métricas de detección
router.post('/metrics', authenticateToken, async (req, res) => {
  try {
    const { metrics, driverId } = req.body;
    const userId = req.user.userId || req.user.id;

    // Obtener el objeto io desde app.locals
    const io = req.app.get('io');
    
    if (!io) {
      return res.status(500).json({ message: 'Socket.IO no disponible' });
    }

    // Emitir métricas a la sala de alertas (todos los admins)
    io.to('alerts').emit('detection_metrics', {
      userId,
      driverId: driverId || userId,
      driver_id: driverId || userId, // Alias para compatibilidad
      metrics,
      timestamp: Date.now(),
    });

    // También emitir a sala específica del conductor si existe
    if (driverId) {
      io.to(`driver_${driverId}`).emit('detection_metrics', {
        userId,
        driverId,
        metrics,
        timestamp: Date.now(),
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error al emitir métricas:', error);
    res.status(500).json({ message: 'Error al emitir métricas' });
  }
});

// Endpoint para emitir frames de video
router.post('/video-frame', authenticateToken, async (req, res) => {
  try {
    const { frameData, driverId, timestamp } = req.body;
    const userId = req.user.userId || req.user.id;

    // Obtener el objeto io desde app.locals
    const io = req.app.get('io');
    
    if (!io) {
      return res.status(500).json({ message: 'Socket.IO no disponible' });
    }

    // Emitir frame de video a la sala de alertas (todos los admins)
    io.to('alerts').emit('video_frame', {
      userId,
      driverId: driverId || userId,
      driver_id: driverId || userId, // Alias para compatibilidad
      frameData,
      timestamp: timestamp || Date.now(),
    });

    // También emitir a sala específica del conductor si existe
    if (driverId) {
      io.to(`driver_${driverId}`).emit('video_frame', {
        userId,
        driverId,
        frameData,
        timestamp: timestamp || Date.now(),
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error al emitir frame de video:', error);
    res.status(500).json({ message: 'Error al emitir frame de video' });
  }
});

module.exports = router;

