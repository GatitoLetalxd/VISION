-- ============================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS - SISTEMA DE ALERTA TEMPRANA VISION
-- ============================================================================
-- MySQL 8.0+
-- Este script contiene toda la estructura de la base de datos del sistema
-- Incluye todas las tablas, índices, vistas, procedimientos y triggers
-- ============================================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS sistema_alerta 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE sistema_alerta;

-- ============================================================================
-- TABLA: users - Usuarios del sistema
-- ============================================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'operator', 'viewer', 'driver') NOT NULL DEFAULT 'driver',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    profile_photo VARCHAR(255) NULL COMMENT 'Nombre del archivo de foto de perfil',
    preferred_detection_model ENUM('face-api', 'mediapipe') NOT NULL DEFAULT 'face-api',
    last_login TIMESTAMP NULL,
    refresh_token TEXT NULL,
    refresh_token_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at),
    INDEX idx_preferred_detection_model (preferred_detection_model)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLA: drivers - Conductores registrados
-- ============================================================================
CREATE TABLE drivers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NULL COMMENT 'ID del usuario asociado (si el conductor es también usuario del sistema)',
    license_number VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    date_of_birth DATE NOT NULL,
    license_expiry DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    alert_threshold DECIMAL(3,2) NOT NULL DEFAULT 0.70,
    preferred_detection_model ENUM('face-api', 'mediapipe') NOT NULL DEFAULT 'face-api',
    emergency_contact VARCHAR(100) NULL,
    emergency_phone VARCHAR(20) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_license_number (license_number),
    INDEX idx_is_active (is_active),
    INDEX idx_license_expiry (license_expiry),
    INDEX idx_created_at (created_at),
    INDEX idx_preferred_detection_model (preferred_detection_model),
    
    CONSTRAINT chk_alert_threshold CHECK (alert_threshold >= 0.10 AND alert_threshold <= 1.00),
    CONSTRAINT chk_phone_format CHECK (phone IS NULL OR phone REGEXP '^[+]?[1-9][0-9]{0,15}$'),
    CONSTRAINT chk_emergency_phone_format CHECK (emergency_phone IS NULL OR emergency_phone REGEXP '^[+]?[1-9][0-9]{0,15}$'),
    CONSTRAINT chk_email_format CHECK (email IS NULL OR email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    CONSTRAINT fk_drivers_usuario FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- TABLA: vehicles - Vehículos del sistema
-- ============================================================================
CREATE TABLE vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    color VARCHAR(30) NULL,
    vehicle_type ENUM('bus', 'truck', 'van', 'car', 'motorcycle') NOT NULL DEFAULT 'car',
    capacity INT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_maintenance TIMESTAMP NULL,
    next_maintenance TIMESTAMP NULL,
    insurance_expiry DATE NULL,
    registration_expiry DATE NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_plate_number (plate_number),
    INDEX idx_is_active (is_active),
    INDEX idx_vehicle_type (vehicle_type),
    INDEX idx_next_maintenance (next_maintenance),
    INDEX idx_created_at (created_at),
    
    CONSTRAINT chk_year CHECK (year >= 1900 AND year <= 2030),
    CONSTRAINT chk_capacity CHECK (capacity IS NULL OR (capacity >= 1 AND capacity <= 100))
) ENGINE=InnoDB;

-- ============================================================================
-- TABLA: detection_model_settings - Configuración de modelos de detección
-- ============================================================================
CREATE TABLE detection_model_settings (
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

-- ============================================================================
-- TABLA: detection_sessions - Sesiones de detección
-- ============================================================================
CREATE TABLE detection_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id INT NOT NULL,
    vehicle_id INT NULL,
    user_id INT NOT NULL COMMENT 'Usuario que inició la sesión',
    detection_model ENUM('face-api', 'mediapipe') NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    total_frames_processed INT NOT NULL DEFAULT 0,
    total_events INT NOT NULL DEFAULT 0,
    avg_confidence DECIMAL(3,2) NULL,
    avg_latency_ms INT NULL,
    session_notes TEXT NULL,
    location_start JSON NULL COMMENT 'Coordenadas GPS al inicio de la sesión',
    location_end JSON NULL COMMENT 'Coordenadas GPS al final de la sesión',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_driver_id (driver_id),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_user_id (user_id),
    INDEX idx_detection_model (detection_model),
    INDEX idx_started_at (started_at),
    INDEX idx_ended_at (ended_at),
    
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- TABLA: events - Eventos de detección
-- ============================================================================
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id INT NOT NULL,
    vehicle_id INT NULL,
    session_id INT NULL COMMENT 'ID de la sesión de detección asociada',
    event_type ENUM('eye_closed', 'head_nodding', 'yawning', 'blinking_slow', 'distraction', 'normal') NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'low',
    detection_model ENUM('face-api', 'mediapipe') NOT NULL DEFAULT 'face-api',
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location JSON NULL COMMENT 'Coordenadas GPS del evento',
    image_path VARCHAR(500) NULL COMMENT 'Ruta de la imagen capturada',
    metadata JSON NULL COMMENT 'Datos adicionales del evento (EAR, MAR, etc.)',
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_driver_id (driver_id),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_session_id (session_id),
    INDEX idx_event_type (event_type),
    INDEX idx_severity (severity),
    INDEX idx_detection_model (detection_model),
    INDEX idx_timestamp (timestamp),
    INDEX idx_is_processed (is_processed),
    INDEX idx_driver_timestamp (driver_id, timestamp),
    INDEX idx_events_detection_model (detection_model),
    INDEX idx_events_session_id (session_id),
    
    CONSTRAINT chk_confidence CHECK (confidence >= 0.00 AND confidence <= 1.00),
    
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES detection_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- TABLA: alerts - Alertas del sistema
-- ============================================================================
CREATE TABLE alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    driver_id INT NOT NULL,
    vehicle_id INT NULL,
    alert_type ENUM('drowsiness_warning', 'drowsiness_critical', 'distraction_warning', 'system_alert', 'maintenance_reminder') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'delivered', 'read', 'acknowledged', 'dismissed') NOT NULL DEFAULT 'pending',
    priority INT NOT NULL DEFAULT 1,
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    acknowledged_at TIMESTAMP NULL,
    acknowledged_by INT NULL,
    response TEXT NULL COMMENT 'Respuesta del conductor o supervisor',
    metadata JSON NULL COMMENT 'Datos adicionales de la alerta',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_event_id (event_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at),
    INDEX idx_driver_status (driver_id, status),
    INDEX idx_alerts_status_created (status, created_at),
    INDEX idx_alerts_driver_status (driver_id, status, created_at),
    
    CONSTRAINT chk_priority CHECK (priority >= 1 AND priority <= 5),
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- TABLA: system_config - Configuraciones del sistema
-- ============================================================================
CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT NULL,
    is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLA: system_logs - Logs del sistema
-- ============================================================================
CREATE TABLE system_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    level ENUM('debug', 'info', 'warn', 'error', 'fatal') NOT NULL,
    message TEXT NOT NULL,
    context JSON NULL,
    user_id INT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_level (level),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Insertar usuarios iniciales (contraseña por defecto: 'admin123' - debe cambiarse)
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('admin@sistema-alerta.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8J8K8K8K8K', 'Administrador', 'Sistema', 'admin'),
('operator@sistema-alerta.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8J8K8K8K8K', 'Operador', 'Sistema', 'operator');

-- Insertar configuraciones del sistema
INSERT INTO system_config (config_key, config_value, description) VALUES
('system_name', 'Sistema de Alerta Temprana', 'Nombre del sistema'),
('system_version', '1.0.0', 'Versión del sistema'),
('alert_threshold_default', '0.70', 'Umbral de alerta por defecto'),
('max_events_per_session', '1000', 'Máximo de eventos por sesión'),
('session_timeout_minutes', '480', 'Timeout de sesión en minutos'),
('vision_service_url', 'http://localhost:8000', 'URL del servicio de visión'),
('vision_service_api_key', 'vision_api_key_123', 'API key del servicio de visión'),
('notification_enabled', 'true', 'Habilitar notificaciones'),
('email_notifications', 'true', 'Habilitar notificaciones por email'),
('sms_notifications', 'false', 'Habilitar notificaciones por SMS');

-- Insertar configuraciones de modelos de detección
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
    'Detección en navegador usando TensorFlow.js. Procesamiento 100% local, privacidad total.',
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
    'Detección en servidor usando MediaPipe. Mayor precisión con 468 landmarks y detección de postura de cabeza.',
    'server',
    468,
    120,
    FALSE,
    50,
    5.00
);

-- ============================================================================
-- VISTAS
-- ============================================================================

-- Vista: Estadísticas de conductores
CREATE VIEW v_driver_stats AS
SELECT 
    d.id,
    d.license_number,
    d.usuario_id,
    CONCAT(d.first_name, ' ', d.last_name) as full_name,
    d.is_active,
    COUNT(e.id) as total_events,
    COUNT(CASE WHEN e.severity = 'critical' THEN 1 END) as critical_events,
    COUNT(CASE WHEN e.severity = 'high' THEN 1 END) as high_events,
    AVG(e.confidence) as avg_confidence,
    MAX(e.timestamp) as last_event,
    COUNT(a.id) as total_alerts,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_alerts
FROM drivers d
LEFT JOIN events e ON d.id = e.driver_id
LEFT JOIN alerts a ON d.id = a.driver_id
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.license_number, d.usuario_id, d.first_name, d.last_name, d.is_active;

-- Vista: Estadísticas de vehículos
CREATE VIEW v_vehicle_stats AS
SELECT 
    v.id,
    v.plate_number,
    CONCAT(v.year, ' ', v.make, ' ', v.model) as description,
    v.vehicle_type,
    v.is_active,
    COUNT(e.id) as total_events,
    COUNT(CASE WHEN e.severity = 'critical' THEN 1 END) as critical_events,
    MAX(e.timestamp) as last_event,
    v.next_maintenance,
    CASE 
        WHEN v.next_maintenance IS NULL THEN 'N/A'
        WHEN v.next_maintenance <= NOW() THEN 'Overdue'
        WHEN v.next_maintenance <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'Due Soon'
        ELSE 'OK'
    END as maintenance_status
FROM vehicles v
LEFT JOIN events e ON v.id = e.vehicle_id
WHERE v.deleted_at IS NULL
GROUP BY v.id, v.plate_number, v.year, v.make, v.model, v.vehicle_type, v.is_active, v.next_maintenance;

-- Vista: Alertas recientes
CREATE VIEW v_recent_alerts AS
SELECT 
    a.id,
    a.title,
    a.message,
    a.severity,
    a.status,
    a.priority,
    a.created_at,
    d.license_number,
    CONCAT(d.first_name, ' ', d.last_name) as driver_name,
    v.plate_number,
    CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_description
FROM alerts a
JOIN drivers d ON a.driver_id = d.id
LEFT JOIN vehicles v ON a.vehicle_id = v.id
WHERE a.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
AND a.deleted_at IS NULL
ORDER BY a.created_at DESC;

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

DELIMITER //

-- Procedimiento: Limpiar eventos antiguos
CREATE PROCEDURE CleanupOldEvents(IN days_to_keep INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Eliminar eventos más antiguos que el período especificado
    DELETE FROM events 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY)
    AND is_processed = TRUE;
    
    -- Eliminar alertas relacionadas
    DELETE FROM alerts 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY)
    AND status IN ('acknowledged', 'dismissed');
    
    COMMIT;
END //

-- Procedimiento: Generar reporte de conductor
CREATE PROCEDURE GenerateDriverReport(IN driver_id INT, IN start_date DATE, IN end_date DATE)
BEGIN
    SELECT 
        d.license_number,
        CONCAT(d.first_name, ' ', d.last_name) as driver_name,
        COUNT(e.id) as total_events,
        COUNT(CASE WHEN e.severity = 'critical' THEN 1 END) as critical_events,
        COUNT(CASE WHEN e.severity = 'high' THEN 1 END) as high_events,
        COUNT(CASE WHEN e.severity = 'medium' THEN 1 END) as medium_events,
        COUNT(CASE WHEN e.severity = 'low' THEN 1 END) as low_events,
        AVG(e.confidence) as avg_confidence,
        COUNT(a.id) as total_alerts,
        COUNT(CASE WHEN a.status = 'acknowledged' THEN 1 END) as acknowledged_alerts
    FROM drivers d
    LEFT JOIN events e ON d.id = e.driver_id 
        AND e.timestamp BETWEEN start_date AND end_date
    LEFT JOIN alerts a ON d.id = a.driver_id 
        AND a.created_at BETWEEN start_date AND end_date
    WHERE d.id = driver_id
    AND d.deleted_at IS NULL
    GROUP BY d.id, d.license_number, d.first_name, d.last_name;
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger: Actualizar timestamp de eventos
CREATE TRIGGER tr_events_updated 
BEFORE UPDATE ON events
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

-- Trigger: Actualizar timestamp de alertas
CREATE TRIGGER tr_alerts_updated 
BEFORE UPDATE ON alerts
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

-- Trigger: Log de eventos críticos
CREATE TRIGGER tr_critical_event_log 
AFTER INSERT ON events
FOR EACH ROW
BEGIN
    IF NEW.severity = 'critical' THEN
        INSERT INTO system_logs (level, message, context, created_at)
        VALUES (
            'warn',
            CONCAT('Evento crítico detectado para conductor ', NEW.driver_id),
            JSON_OBJECT('event_id', NEW.id, 'driver_id', NEW.driver_id, 'event_type', NEW.event_type),
            CURRENT_TIMESTAMP
        );
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================================================

CREATE INDEX idx_events_driver_timestamp ON events(driver_id, timestamp DESC);
CREATE INDEX idx_events_severity_timestamp ON events(severity, timestamp DESC);

-- ============================================================================
-- USUARIO DE APLICACIÓN (OPCIONAL)
-- ============================================================================

-- Crear usuario de aplicación con permisos limitados
-- NOTA: Cambiar la contraseña en producción
CREATE USER IF NOT EXISTS 'alerta_user'@'localhost' IDENTIFIED BY 'secure_password_123';
GRANT SELECT, INSERT, UPDATE, DELETE ON sistema_alerta.* TO 'alerta_user'@'localhost';
GRANT EXECUTE ON PROCEDURE sistema_alerta.CleanupOldEvents TO 'alerta_user'@'localhost';
GRANT EXECUTE ON PROCEDURE sistema_alerta.GenerateDriverReport TO 'alerta_user'@'localhost';
FLUSH PRIVILEGES;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT 'Base de datos sistema_alerta creada exitosamente' as message;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'sistema_alerta';
SELECT table_name FROM information_schema.tables WHERE table_schema = 'sistema_alerta' ORDER BY table_name;

