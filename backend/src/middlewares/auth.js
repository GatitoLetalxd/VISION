const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_temporal';

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log('Headers recibidos:', req.headers);
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Token extraído:', token ? 'Token presente' : 'Token no encontrado');

    if (!token) {
      return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está definido');
      return res.status(500).json({ message: 'Error en la configuración del servidor' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Error al verificar token:', err);
        return res.status(403).json({ message: 'Token inválido o expirado' });
      }

      console.log('Token decodificado:', decoded);

      // Asignar los datos del usuario decodificados a req.user
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        rol: decoded.rol
      };

      console.log('Usuario autenticado:', req.user);
      console.log('URL solicitada:', req.method, req.originalUrl);
      next();
    });
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({ message: 'Error en la autenticación' });
  }
};

// Middleware para verificar si el usuario es admin o superadmin
const isAdmin = (req, res, next) => {
  // Log para depuración
  console.log('Middleware isAdmin, req.user:', req.user);
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }
  // Permitir tanto admin como superadmin
  if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin') {
    return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
  }
  next();
};

// Middleware para verificar si el usuario es superadmin
const isSuperAdmin = (req, res, next) => {
  console.log('isSuperAdmin - Verificando permisos para:', {
    user: req.user,
    method: req.method,
    url: req.originalUrl
  });
  
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  if (req.user.rol !== 'superadmin') {
    console.log('isSuperAdmin - Acceso denegado, rol actual:', req.user.rol);
    return res.status(403).json({ message: 'Esta acción solo puede ser realizada por el superadministrador' });
  }
  
  console.log('isSuperAdmin - Acceso permitido');
  next();
};

// Verificar que las funciones existen antes de exportarlas
if (!authenticateToken || !isAdmin || !isSuperAdmin) {
  throw new Error('Middlewares de autenticación no definidos correctamente');
}

module.exports = {
  authenticateToken,
  isAdmin,
  isSuperAdmin,
  JWT_SECRET
}; 