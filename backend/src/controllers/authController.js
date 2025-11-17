const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const crypto = require('crypto');
const transporter = require('../config/mail.config');

const register = async (req, res) => {
  try {
    const { nombre, apellido, correo, contraseña } = req.body;
    
    // Validar datos de entrada
    if (!nombre || !apellido || !correo || !contraseña) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está definido');
      return res.status(500).json({ message: 'Error en la configuración del servidor' });
    }

    const hashedPassword = await bcrypt.hash(contraseña, 10);
    
    console.log('Intentando registrar usuario:', { nombre, apellido, correo });
    
    const connection = await pool().getConnection();
    
    try {
      // Usar nombre y apellido directamente
      const firstName = nombre.trim();
      const lastName = apellido.trim();
      
      // Insertar en la nueva estructura de tabla users con rol 'driver' por defecto
      const [result] = await connection.execute(
        'INSERT INTO users (email, password, first_name, last_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [correo, hashedPassword, firstName, lastName, 'driver', 1]
      );

      console.log('Usuario insertado con ID:', result.insertId);

      // Obtener los datos del usuario creado
      const [users] = await connection.execute(
        'SELECT id, email, first_name, last_name, role FROM users WHERE id = ?',
        [result.insertId]
      );

      if (!users || users.length === 0) {
        console.error('No se pudo obtener los datos del usuario después de la inserción');
        return res.status(500).json({ message: 'Error al crear el usuario' });
      }

      const user = users[0];
      console.log('Datos del usuario recuperados:', user);

      // Si el usuario es un driver, crear automáticamente un conductor asociado
      if (user.role === 'driver') {
        try {
          // Generar un número de licencia temporal único basado en el ID del usuario
          const licenseNumber = `TEMP-${user.id}-${Date.now()}`;
          
          // Crear conductor asociado al usuario
          const [driverResult] = await connection.execute(
            `INSERT INTO drivers (
              license_number, first_name, last_name, 
              date_of_birth, license_expiry, 
              alert_threshold, usuario_id, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              licenseNumber,
              user.first_name,
              user.last_name,
              '1990-01-01', // Fecha por defecto, el driver deberá actualizarla
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 año desde hoy
              0.70, // Umbral por defecto
              user.id,
              'Conductor creado automáticamente al registrarse. Por favor, actualice la información de la licencia.'
            ]
          );
          
          console.log('Conductor creado automáticamente con ID:', driverResult.insertId);
        } catch (driverError) {
          // Si falla la creación del conductor, no fallar el registro del usuario
          console.error('Error al crear conductor automático (no crítico):', driverError);
        }
      }

      // Crear token para el nuevo usuario
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          rol: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const responseData = { 
        token,
        user: {
          id: user.id,
          nombre: `${user.first_name} ${user.last_name}`,
          correo: user.email,
          rol: user.role
        }
      };

      console.log('Enviando respuesta de registro exitoso');
      res.status(201).json(responseData);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error completo en registro:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }
    res.status(500).json({ message: 'Error en el servidor: ' + error.message });
  }
};

const login = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { correo, contraseña } = req.body;
    
    // Validar datos de entrada
    if (!correo || !contraseña) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
    }
    
    console.log('Intento de login para:', correo);
    
    // Buscar usuario en la nueva estructura
    const [users] = await connection.execute(
      'SELECT id, email, password, first_name, last_name, role, is_active FROM users WHERE email = ? AND deleted_at IS NULL',
      [correo]
    );

    if (users.length === 0) {
      console.log('Usuario no encontrado');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = users[0];
    
    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(403).json({ message: 'Usuario inactivo. Contacta al administrador.' });
    }
    
    console.log('Usuario encontrado:', { 
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    const validPassword = await bcrypt.compare(contraseña, user.password);

    if (!validPassword) {
      console.log('Contraseña inválida');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Actualizar last_login
    await connection.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    const tokenPayload = { 
      userId: user.id, 
      email: user.email,
      rol: user.role 
    };
    
    console.log('Generando token con payload:', tokenPayload);

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Verificar el token inmediatamente después de crearlo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verificado:', decoded);

    const responseData = { 
      token,
      user: {
        id: user.id,
        nombre: `${user.first_name} ${user.last_name}`,
        correo: user.email,
        rol: user.role
      }
    };

    console.log('Login exitoso para:', user.email);
    
    res.json(responseData);
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor: ' + error.message });
  } finally {
    connection.release();
  }
};

const forgotPassword = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ message: 'El correo es requerido' });
    }

    // Verificar si el usuario existe
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
      [correo]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'No existe una cuenta con este correo electrónico' });
    }

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    // Guardar el token en la base de datos con tiempo de expiración (1 hora)
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora desde ahora
    
    // Nota: Necesitarías agregar columnas reset_token y reset_token_expires a la tabla users
    // Por ahora, usaremos el campo refresh_token temporalmente
    await connection.execute(
      'UPDATE users SET refresh_token = ?, refresh_token_expires = ? WHERE email = ?',
      [resetTokenHash, expiresAt, correo]
    );

    // Enviar correo con el enlace de restablecimiento
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: correo,
      subject: 'Restablecimiento de Contraseña - VISION-TGM',
      html: `
        <h1>Restablecimiento de Contraseña</h1>
        <p>Has solicitado restablecer tu contraseña en VISION-TGM.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${resetUrl}">Restablecer Contraseña</a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Se ha enviado un enlace de restablecimiento a tu correo electrónico' });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud: ' + error.message });
  } finally {
    connection.release();
  }
};

const resetPassword = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { token, contraseña } = req.body;

    if (!token || !contraseña) {
      return res.status(400).json({ message: 'Token y contraseña son requeridos' });
    }

    // Buscar usuario con token de restablecimiento válido
    const [users] = await connection.execute(
      'SELECT id, refresh_token FROM users WHERE refresh_token_expires > NOW() AND deleted_at IS NULL'
    );

    // Buscar el usuario con el token correcto
    let user = null;
    for (const u of users) {
      if (u.refresh_token && await bcrypt.compare(token, u.refresh_token)) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    await connection.execute(
      'UPDATE users SET password = ?, refresh_token = NULL, refresh_token_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña: ' + error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
};
