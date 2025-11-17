-- Agregar configuracion de modelo de deteccion
-- Ejecutar: mysql -u root -p sistema_alerta < add_detection_model_config.sql

USE sistema_alerta;

-- Agregar columna de modelo de deteccion preferido a usuarios
ALTER TABLE users 
ADD COLUMN preferred_detection_model ENUM('face-api', 'mediapipe') NOT NULL DEFAULT 'face-api' 
AFTER role;

-- Agregar columna de modelo de deteccion preferido a conductores
ALTER TABLE drivers
ADD COLUMN preferred_detection_model ENUM('face-api', 'mediapipe') NOT NULL DEFAULT 'face-api'
AFTER alert_threshold;

-- Crear tabla de configuracion de modelos
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

-- Insertar configuraciones predeterminadas
INSERT INTO detection_model_settings (
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

-- Crear tabla de sesiones de deteccion
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

-- Agregar modelo usado a la tabla de eventos
ALTER TABLE events
ADD COLUMN detection_model ENUM('face-api', 'mediapipe') NOT NULL DEFAULT 'face-api'
AFTER severity;

ALTER TABLE events
ADD COLUMN session_id INT NULL
AFTER detection_model;

ALTER TABLE events
ADD CONSTRAINT fk_events_session
FOREIGN KEY (session_id) REFERENCES detection_sessions(id) ON DELETE SET NULL;

-- Crear indices adicionales
CREATE INDEX idx_events_detection_model ON events(detection_model);
CREATE INDEX idx_events_session_id ON events(session_id);

-- Mostrar resultado
SELECT 'Configuracion de modelos de deteccion agregada exitosamente' AS mensaje;

-- Verificar
SELECT * FROM detection_model_settings;

