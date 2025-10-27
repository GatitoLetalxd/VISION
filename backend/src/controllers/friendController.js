const { pool } = require('../config/database');

const searchUsers = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { query } = req.query;
    const userId = req.user.userId;

    // Buscar usuarios que coincidan con la búsqueda, excluyendo al usuario actual
    const [users] = await connection.execute(
      `SELECT u.id, u.first_name, u.last_name, u.email
      FROM users u
      WHERE u.id != ? AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)
      LIMIT 10`,
      [userId, `%${query}%`, `%${query}%`, `%${query}%`]
    );

    res.json(users.map(user => ({
      id_usuario: user.id,
      nombre: `${user.first_name} ${user.last_name}`,
      foto_perfil: null,
      estado: null
    })));
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({ message: 'Error al buscar usuarios' });
  } finally {
    connection.release();
  }
};

const getFriends = async (req, res) => {
  try {
    // Por ahora, la funcionalidad de amigos no está implementada en la base de datos
    // Devolvemos un array vacío para evitar errores
    res.json([]);
  } catch (error) {
    console.error('Error al obtener amigos:', error);
    res.status(500).json({ message: 'Error al obtener amigos' });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    // Por ahora, la funcionalidad de amigos no está implementada en la base de datos
    // Devolvemos un array vacío para evitar errores
    res.json([]);
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    res.status(500).json({ message: 'Error al obtener solicitudes pendientes' });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    // Funcionalidad de amigos pendiente de implementación
    res.status(501).json({ message: 'Funcionalidad pendiente de implementación' });
  } catch (error) {
    console.error('Error al enviar solicitud:', error);
    res.status(500).json({ message: 'Error al enviar solicitud' });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    // Funcionalidad de amigos pendiente de implementación
    res.status(501).json({ message: 'Funcionalidad pendiente de implementación' });
  } catch (error) {
    console.error('Error al aceptar solicitud:', error);
    res.status(500).json({ message: 'Error al aceptar solicitud' });
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    // Funcionalidad de amigos pendiente de implementación
    res.status(501).json({ message: 'Funcionalidad pendiente de implementación' });
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    res.status(500).json({ message: 'Error al rechazar solicitud' });
  }
};

module.exports = {
  searchUsers,
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest
}; 