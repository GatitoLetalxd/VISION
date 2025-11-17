-- Agregar configuracion de modelo de deteccion (VERSION SEGURA)
-- Ejecutar: mysql -u root -p sistema_alerta < add_detection_model_config_safe.sql

USE sistema_alerta;

-- ===========================================================
-- PASO 1: Agregar columnas solo si no existen
-- ===========================================================

-- Verificar y agregar columna a users
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'preferred_detection_model';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Column already exists" AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(''face-api'', ''mediapipe'') NOT NULL DEFAULT ''face-api'' AFTER role;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar y agregar columna a drivers
SET @tablename = 'drivers';
SET @columnname = 'preferred_detection_model';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Column already exists" AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(''face-api'', ''mediapipe'') NOT NULL DEFAULT ''face-api'' AFTER alert_threshold;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ===========================================================
-- PASO 2: Crear tabla detection_model_settings si no existe
-- ===========================================================

CREATE TABLE IF NOT EXISTS detection_model_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    model_name ENUM('face-api', 'mediapipe') NOT NULL UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    processing_location ENUM('client', 'server') NOT NULL,
    landmarks_count INT NOT NULL,
    avg_latency_ms INT NULL,
    requires_gpu BOOLEAN NOT NULL DEFAULT FALSE,
    max_concurrent_users INT NULL,
    cost_per_hour DECIMAL(10,2) NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_model_name (model_name),
    INDEX idx_is_enabled (is_enabled)
) ENGINE=InnoDB;

-- ===========================================================
-- PASO 3: Insertar configuraciones predeterminadas (si no existen)
-- ===========================================================

INSERT IGNORE INTO detection_model_settings (
    model_name, 
    is_enabled, 
    display_name, 
    description, 
    processing_location, 
    landmarks_count, 
    avg_latency_ms, 
    requires_gpu, 
    max_concurrent_users, 
    cost_per_hour
) VALUES 
(
    'face-api', 
    TRUE, 
    'face-api.js (JavaScript)',
    'Deteccion en navegador usando TensorFlow.js. Procesamiento 100% local, privacidad total.',
    'client',
    68,
    80,
    FALSE,
    NULL,
    0.00
),
(
    'mediapipe',
    TRUE,
    'MediaPipe (Python)',
    'Deteccion en servidor usando MediaPipe. Mayor precision con 468 landmarks y deteccion de postura de cabeza.',
    'server',
    468,
    120,
    FALSE,
    50,
    5.00
);

-- ===========================================================
-- PASO 4: Crear tabla detection_sessions si no existe
-- ===========================================================

CREATE TABLE IF NOT EXISTS detection_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id INT NOT NULL,
    vehicle_id INT NULL,
    user_id INT NOT NULL,
    detection_model ENUM('face-api', 'mediapipe') NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    total_frames_processed INT NOT NULL DEFAULT 0,
    total_events INT NOT NULL DEFAULT 0,
    avg_confidence DECIMAL(3,2) NULL,
    avg_latency_ms INT NULL,
    session_notes TEXT NULL,
    
    INDEX idx_driver_id (driver_id),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_user_id (user_id),
    INDEX idx_detection_model (detection_model),
    INDEX idx_started_at (started_at),
    
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===========================================================
-- PASO 5: Agregar columnas a events si no existen
-- ===========================================================

-- Verificar y agregar columna detection_model a events
SET @tablename = 'events';
SET @columnname = 'detection_model';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Column already exists" AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(''face-api'', ''mediapipe'') NOT NULL DEFAULT ''face-api'' AFTER severity;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar y agregar columna session_id a events
SET @tablename = 'events';
SET @columnname = 'session_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Column already exists" AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT NULL AFTER detection_model;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ===========================================================
-- PASO 6: Agregar foreign key si no existe
-- ===========================================================

-- Verificar si la foreign key ya existe antes de agregarla
SET @fk_name = 'fk_events_session';
SET @fk_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = @dbname
    AND TABLE_NAME = 'events'
    AND CONSTRAINT_NAME = @fk_name
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @preparedStatement = (SELECT IF(
    @fk_exists > 0,
    'SELECT "Foreign key already exists" AS message;',
    'ALTER TABLE events ADD CONSTRAINT fk_events_session FOREIGN KEY (session_id) REFERENCES detection_sessions(id) ON DELETE SET NULL;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ===========================================================
-- PASO 7: Crear indices adicionales si no existen
-- ===========================================================

-- Crear indice en events.detection_model si no existe
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = 'events'
    AND INDEX_NAME = 'idx_events_detection_model'
);

SET @preparedStatement = (SELECT IF(
    @index_exists > 0,
    'SELECT "Index already exists" AS message;',
    'CREATE INDEX idx_events_detection_model ON events(detection_model);'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Crear indice en events.session_id si no existe
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = 'events'
    AND INDEX_NAME = 'idx_events_session_id'
);

SET @preparedStatement = (SELECT IF(
    @index_exists > 0,
    'SELECT "Index already exists" AS message;',
    'CREATE INDEX idx_events_session_id ON events(session_id);'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ===========================================================
-- PASO 8: Mostrar resultado
-- ===========================================================

SELECT 'Configuracion de modelos de deteccion completada exitosamente' AS mensaje;

-- Verificar configuracion
SELECT 
    'Modelos configurados:' AS info,
    COUNT(*) AS total_modelos
FROM detection_model_settings;

SELECT * FROM detection_model_settings;

SELECT 
    'Columnas agregadas correctamente' AS info,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'users' 
     AND COLUMN_NAME = 'preferred_detection_model') AS users_column,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'drivers' 
     AND COLUMN_NAME = 'preferred_detection_model') AS drivers_column,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'events' 
     AND COLUMN_NAME = 'detection_model') AS events_model_column,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'events' 
     AND COLUMN_NAME = 'session_id') AS events_session_column;

