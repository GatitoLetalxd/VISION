const mysql = require('mysql2/promise');
require('dotenv').config();

// Verificar que todas las variables de entorno necesarias estén definidas
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Error: Faltan las siguientes variables de entorno:', missingEnvVars);
  console.error('Por favor, verifica que el archivo .env existe y contiene todas las variables necesarias.');
  process.exit(1);
}

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 20, // Aumentado de 10 a 20 para más concurrencia
  queueLimit: 0,
  connectTimeout: 10000, // Reducido de 60s a 10s
  enableKeepAlive: true, // Mantener conexiones activas
  keepAliveInitialDelay: 0,
  // Optimizaciones adicionales
  timezone: '+00:00', // UTC para evitar conversiones
  supportBigNumbers: true,
  bigNumberStrings: false,
  dateStrings: false,
  // Cache de consultas preparadas
  namedPlaceholders: false
};

console.log('Intentando conectar a la base de datos con la siguiente configuración:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

// Crear pool de conexiones con reintentos
const createPoolWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const pool = mysql.createPool(dbConfig);
      // Probar la conexión
      await pool.getConnection();
      console.log('Conexión a la base de datos establecida correctamente');
      return pool;
    } catch (error) {
      console.error(`Intento ${i + 1}/${retries} fallido:`, error.message);
      if (i < retries - 1) {
        console.log(`Reintentando en ${delay/1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

let pool;

// Inicializar el pool
const initializePool = async () => {
  try {
    pool = await createPoolWithRetry();
  } catch (error) {
    console.error('Error fatal al conectar con la base de datos después de todos los reintentos');
    throw error;
  }
};

// Función para probar la conexión
const testConnection = async () => {
  if (!pool) {
    await initializePool();
  }
  
  try {
    const connection = await pool.getConnection();
    console.log('Conexión de prueba exitosa');
    
    // Verificar que la tabla users existe
    const [tables] = await connection.query('SHOW TABLES LIKE "users"');
    if (tables.length === 0) {
      console.warn('¡Advertencia! La tabla users no existe');
    } else {
      const [columns] = await connection.query('DESCRIBE users');
      console.log('Estructura de la tabla users:', columns.map(col => col.Field));
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Error al probar la conexión:', error.message);
    throw error;
  }
};

// Función para ejecutar queries con reintentos
const executeQuery = async (query, params = [], retries = 3) => {
  if (!pool) {
    await initializePool();
  }

  for (let i = 0; i < retries; i++) {
    try {
      const [results] = await pool.execute(query, params);
      return results;
    } catch (error) {
      if (error.code === 'PROTOCOL_CONNECTION_LOST' && i < retries - 1) {
        console.log('Conexión perdida, reintentando...');
        await initializePool();
        continue;
      }
      throw error;
    }
  }
};

// Inicializar el pool inmediatamente
initializePool().catch(error => {
  console.error('Error al inicializar el pool:', error);
  process.exit(1);
});

module.exports = {
  pool: () => pool,
  testConnection,
  executeQuery
}; 