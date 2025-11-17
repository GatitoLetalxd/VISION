const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

const getProfile = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const [users] = await connection.execute(
      'SELECT id, first_name, last_name, email, role, profile_photo, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      nombre: user.first_name,
      apellido: user.last_name,
      correo: user.email,
      rol: user.role,
      foto_perfil: user.profile_photo ? `/uploads/profile-photos/${user.profile_photo}` : null,
      fecha_registro: user.created_at
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener datos del perfil' });
  } finally {
    connection.release();
  }
};

const updateProfile = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { nombre, apellido, correo } = req.body;
    
    // Verificar si el correo ya está en uso por otro usuario
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [correo, req.user.userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'El correo ya está en uso' });
    }

    await connection.execute(
      'UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?',
      [nombre, apellido || '', correo, req.user.userId]
    );

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  } finally {
    connection.release();
  }
};

const updateProfilePhoto = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
    }

    const userId = req.user.userId;
    
    // Obtener la foto anterior para eliminarla
    const [users] = await connection.execute(
      'SELECT profile_photo FROM users WHERE id = ?',
      [userId]
    );

    const oldPhoto = users[0]?.profile_photo;
    
    // Eliminar foto anterior si existe
    if (oldPhoto) {
      const oldPhotoPath = path.join(__dirname, '../../uploads/profile-photos', oldPhoto);
      try {
        await fs.unlink(oldPhotoPath);
      } catch (err) {
        console.log('No se pudo eliminar la foto anterior:', err.message);
      }
    }

    // Generar nombre único para la nueva foto
    const timestamp = Date.now();
    const ext = path.extname(req.file.originalname);
    const filename = `user_${userId}_${timestamp}${ext}`;
    
    // Mover el archivo temporal al directorio de fotos de perfil
    const uploadPath = path.join(__dirname, '../../uploads/profile-photos', filename);
    await fs.rename(req.file.path, uploadPath);

    // Actualizar la base de datos
    await connection.execute(
      'UPDATE users SET profile_photo = ? WHERE id = ?',
      [filename, userId]
    );

    res.json({ 
      message: 'Foto de perfil actualizada correctamente',
      foto_url: `/uploads/profile-photos/${filename}`
    });
  } catch (error) {
    console.error('Error al actualizar foto:', error);
    res.status(500).json({ 
      message: 'Error al actualizar la foto de perfil',
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

const getAllUsers = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    // Incluir información adicional útil para admin
    const [users] = await connection.execute(
      `SELECT 
        id, 
        first_name, 
        last_name, 
        email, 
        role, 
        is_active,
        last_login,
        created_at 
      FROM users 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC`
    );

    res.json(users.map(user => ({
      id_usuario: user.id,
      nombre: user.first_name,
      apellido: user.last_name,
      correo: user.email,
      rol: user.role,
      activo: user.is_active === 1,
      ultimo_acceso: user.last_login,
      fecha_registro: user.created_at
    })));
  } catch (error) {
    console.error('Error al obtener lista de usuarios:', error);
    res.status(500).json({ message: 'Error al obtener la lista de usuarios' });
  } finally {
    connection.release();
  }
};

// Cambiar rol de usuario (solo admin)
const updateUserRole = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.user.userId || req.user.id;
    const adminRole = req.user.rol || req.user.role;

    console.log('[updateUserRole] Datos recibidos:', { userId, role, adminId, adminRole });

    // Verificar que quien hace la solicitud es admin
    if (adminRole !== 'admin') {
      console.log('[updateUserRole] Error: Usuario no es admin', { adminRole });
      return res.status(403).json({ 
        message: 'Solo los administradores pueden cambiar roles de usuarios' 
      });
    }

    // Validar que el rol sea válido
    const validRoles = ['admin', 'operator', 'viewer', 'driver'];
    if (!role || !validRoles.includes(role)) {
      console.log('[updateUserRole] Error: Rol inválido', { role, validRoles });
      return res.status(400).json({ 
        message: `Rol inválido. Debe ser uno de: ${validRoles.join(', ')}` 
      });
    }

    // Verificar que el usuario a modificar existe
    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const targetUser = users[0];

    // Evitar que un admin se quite sus propios permisos de admin
    if (parseInt(userId) === adminId && role !== 'admin') {
      return res.status(400).json({ 
        message: 'No puedes quitarte tus propios permisos de administrador' 
      });
    }

    // Actualizar el rol
    await connection.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    // Log de auditoría (opcional, para trazabilidad)
    console.log(`[AUDIT] Admin ${adminId} cambió el rol del usuario ${userId} (${targetUser.email}) de ${targetUser.role} a ${role}`);

    res.json({ 
      message: 'Rol actualizado correctamente',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        nombre: targetUser.first_name,
        apellido: targetUser.last_name,
        rol: role
      }
    });
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ message: 'Error al actualizar el rol del usuario' });
  } finally {
    connection.release();
  }
};

// Activar/desactivar usuario (solo admin)
const toggleUserStatus = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { userId } = req.params;
    const { is_active } = req.body;
    const adminId = req.user.userId;
    const adminRole = req.user.rol;

    // Verificar que quien hace la solicitud es admin
    if (adminRole !== 'admin') {
      return res.status(403).json({ 
        message: 'Solo los administradores pueden activar/desactivar usuarios' 
      });
    }

    // Evitar que un admin se desactive a sí mismo
    if (parseInt(userId) === adminId) {
      return res.status(400).json({ 
        message: 'No puedes desactivar tu propia cuenta' 
      });
    }

    // Actualizar el estado
    await connection.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active ? 1 : 0, userId]
    );

    // Log de auditoría
    console.log(`[AUDIT] Admin ${adminId} ${is_active ? 'activó' : 'desactivó'} al usuario ${userId}`);

    res.json({ 
      message: `Usuario ${is_active ? 'activado' : 'desactivado'} correctamente` 
    });
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({ message: 'Error al cambiar el estado del usuario' });
  } finally {
    connection.release();
  }
};

// Eliminar usuario (solo admin)
const deleteUser = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;
    const adminRole = req.user.rol;

    // Verificar que quien hace la solicitud es admin
    if (adminRole !== 'admin') {
      return res.status(403).json({ 
        message: 'Solo los administradores pueden eliminar usuarios' 
      });
    }

    // Evitar que un admin se elimine a sí mismo
    if (parseInt(userId) === adminId) {
      return res.status(400).json({ 
        message: 'No puedes eliminar tu propia cuenta' 
      });
    }

    // Soft delete (marcar como eliminado)
    await connection.execute(
      'UPDATE users SET deleted_at = NOW(), is_active = 0 WHERE id = ?',
      [userId]
    );

    // Log de auditoría
    console.log(`[AUDIT] Admin ${adminId} eliminó al usuario ${userId}`);

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar el usuario' });
  } finally {
    connection.release();
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser
}; 