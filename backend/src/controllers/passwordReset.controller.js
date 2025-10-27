const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const transporter = require('../config/mail.config');
const { pool } = require('../config/database');

const passwordResetController = {
  // Solicitar recuperación de contraseña
  requestReset: async (req, res) => {
    const connection = await pool().getConnection();
    try {
      const { email } = req.body;

      // Verificar si el usuario existe
      const [users] = await connection.execute(
        'SELECT id_usuario, nombre FROM Usuario WHERE correo = ?', 
        [email]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ message: 'No existe una cuenta con este correo electrónico' });
      }

      const user = users[0];

      // Generar token de recuperación (válido por 1 hora)
      const resetToken = jwt.sign(
        { id: user.id_usuario },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Guardar el token en la base de datos
      await connection.execute(
        'UPDATE Usuario SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id_usuario = ?',
        [resetToken, user.id_usuario]
      );

      // Enviar correo con el enlace de recuperación
      // Detectar la IP del servidor dinámicamente
      const serverIP = req.get('host').split(':')[0];
      const resetLink = `http://${serverIP}:5173/reset-password/${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Recuperación de Contraseña',
        html: `
          <h1>Recuperación de Contraseña</h1>
          <p>Hola ${user.nombre},</p>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <a href="${resetLink}">Restablecer Contraseña</a>
          <p>Este enlace es válido por 1 hora.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        `
      };

      await transporter.sendMail(mailOptions);

      res.json({ message: 'Se ha enviado un enlace de recuperación a tu correo electrónico' });
    } catch (error) {
      console.error('Error en requestReset:', error);
      res.status(500).json({ message: 'Error al procesar la solicitud' });
    } finally {
      connection.release();
    }
  },

  // Restablecer contraseña
  resetPassword: async (req, res) => {
    const connection = await pool().getConnection();
    try {
      const { token, newPassword } = req.body;

      // Verificar si el token es válido y no ha expirado
      const [users] = await connection.execute(
        'SELECT id_usuario FROM Usuario WHERE reset_token = ? AND reset_token_expires > NOW()',
        [token]
      );

      if (users.length === 0) {
        return res.status(400).json({ message: 'El enlace ha expirado o no es válido' });
      }

      // Encriptar la nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Actualizar la contraseña y limpiar el token
      await connection.execute(
        'UPDATE Usuario SET contraseña = ?, reset_token = NULL, reset_token_expires = NULL WHERE id_usuario = ?',
        [hashedPassword, users[0].id_usuario]
      );

      res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      console.error('Error en resetPassword:', error);
      res.status(500).json({ message: 'Error al restablecer la contraseña' });
    } finally {
      connection.release();
    }
  }
};

module.exports = passwordResetController; 