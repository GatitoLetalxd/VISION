require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Rutas existentes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const healthRoutes = require('./routes/healthRoutes');
const passwordResetRoutes = require('./routes/passwordReset.routes');

// Nuevas rutas para sistema de detección de somnolencia
const driverRoutes = require('./routes/driverRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const eventRoutes = require('./routes/eventRoutes');
const alertRoutes = require('./routes/alertRoutes');
const detectionModelRoutes = require('./routes/detectionModelRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const videoProcessingRoutes = require('./routes/videoProcessingRoutes');

const { testConnection } = require('./config/database');

const app = express();

// Configurar HTTPS si los certificados existen
const certPath = path.join(__dirname, '../../.cert');
const keyPath = path.join(certPath, 'key.pem');
const certFilePath = path.join(certPath, 'cert.pem');

console.log('🔍 Buscando certificados SSL en:', certPath);
console.log('  - Key:', keyPath, '→', fs.existsSync(keyPath) ? '✅' : '❌');
console.log('  - Cert:', certFilePath, '→', fs.existsSync(certFilePath) ? '✅' : '❌');

let server;
if (fs.existsSync(keyPath) && fs.existsSync(certFilePath)) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certFilePath),
  };
  server = https.createServer(httpsOptions, app);
  console.log('🔒 Servidor HTTPS habilitado');
} else {
  server = http.createServer(app);
  console.log('⚠️  Servidor HTTP (sin SSL) - Los certificados no se encontraron');
}

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Hacer que io esté disponible para las rutas
app.set('io', io);

// Middleware de seguridad con configuración ajustada para permitir recursos cross-origin
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  }
}));
app.use(compression());

// Rate limiting optimizado
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Aumentado de 100 a 500 para mejor rendimiento en producción
  standardHeaders: true,
  legacyHeaders: false,
  // Excluir rutas de health check
  skip: (req) => req.path === '/api/health'
});
app.use('/api/', limiter);

// Configuración unificada de CORS - Permitir acceso desde cualquier IP
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origen (mobile apps, etc) y desde cualquier origen
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos con caché
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d', // Cache de 1 día para archivos estáticos
  etag: true,
  lastModified: true
}));

// Rutas existentes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/password', passwordResetRoutes);

// Nuevas rutas para sistema de detección de somnolencia
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/detection', detectionModelRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/video', videoProcessingRoutes);

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API VISION - Sistema de Detección de Somnolencia funcionando correctamente',
    version: '1.0.0',
    features: ['drowsiness_detection', 'real_time_alerts', 'driver_management', 'vehicle_tracking']
  });
});

// Configurar Socket.IO para alertas en tiempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Unirse a sala de alertas
  socket.on('join_alerts', (data) => {
    socket.join('alerts');
    console.log(`Cliente ${socket.id} se unió a la sala de alertas`);
  });

  // Unirse a sala de eventos específicos
  socket.on('join_driver_events', (driverId) => {
    socket.join(`driver_${driverId}`);
    console.log(`Cliente ${socket.id} se unió a eventos del conductor ${driverId}`);
  });

  // Desconexión
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Hacer io disponible globalmente para usar en las rutas
app.set('io', io);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Ha ocurrido un error en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Ruta para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Iniciar el servidor y probar la conexión a la base de datos
const PORT = process.env.PORT || 5000;

// Probar la conexión a la base de datos antes de iniciar el servidor
testConnection()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor VISION corriendo en el puerto ${PORT}`);
      console.log(`📡 URL del servidor: http://0.0.0.0:${PORT}`);
      console.log(`🌐 Accesible desde cualquier IP en el puerto ${PORT}`);
      console.log(`🔌 Socket.IO habilitado para alertas en tiempo real`);
      console.log(`📊 Sistema de Detección de Somnolencia activo`);
    });
  })
  .catch(error => {
    console.error('Error al conectar con la base de datos:', error);
    process.exit(1);
  }); 