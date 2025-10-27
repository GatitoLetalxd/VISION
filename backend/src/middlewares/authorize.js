/**
 * Middleware de Autorización por Roles
 * 
 * Uso:
 * router.get('/ruta', authenticateToken, authorize('admin', 'operator'), controller.function)
 */

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({ 
        message: 'No estás autenticado. Por favor inicia sesión.',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.rol;

    // Verificar si el usuario tiene un rol permitido
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'No tienes permisos para acceder a este recurso',
        requiredRoles: allowedRoles,
        yourRole: userRole,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Usuario tiene permisos, continuar
    next();
  };
};

module.exports = { authorize };

