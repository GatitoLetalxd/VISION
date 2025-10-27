-- Script de datos de prueba para Sistema de Alerta Temprana
-- Ejecutar después de crear el esquema

USE sistema_alerta;

-- Insertar conductores de prueba
INSERT INTO drivers (license_number, first_name, last_name, phone, email, date_of_birth, license_expiry, alert_threshold, emergency_contact, emergency_phone) VALUES
('LIC001', 'Juan', 'Pérez', '+1234567890', 'juan.perez@email.com', '1985-03-15', '2025-03-15', 0.70, 'María Pérez', '+1234567891'),
('LIC002', 'María', 'González', '+1234567892', 'maria.gonzalez@email.com', '1990-07-22', '2026-07-22', 0.75, 'Carlos González', '+1234567893'),
('LIC003', 'Carlos', 'Rodríguez', '+1234567894', 'carlos.rodriguez@email.com', '1988-11-08', '2025-11-08', 0.65, 'Ana Rodríguez', '+1234567895'),
('LIC004', 'Ana', 'Martínez', '+1234567896', 'ana.martinez@email.com', '1992-01-30', '2027-01-30', 0.80, 'Luis Martínez', '+1234567897'),
('LIC005', 'Luis', 'Fernández', '+1234567898', 'luis.fernandez@email.com', '1987-09-12', '2025-09-12', 0.72, 'Carmen Fernández', '+1234567899');

-- Insertar vehículos de prueba
INSERT INTO vehicles (plate_number, make, model, year, color, vehicle_type, capacity, last_maintenance, next_maintenance, insurance_expiry, registration_expiry) VALUES
('ABC-123', 'Volvo', 'B7R', 2020, 'Blanco', 'bus', 50, '2023-10-01 10:00:00', '2024-04-01 10:00:00', '2024-12-31', '2024-12-31'),
('DEF-456', 'Mercedes', 'Sprinter', 2021, 'Azul', 'van', 12, '2023-11-15 14:30:00', '2024-05-15 14:30:00', '2024-11-30', '2024-11-30'),
('GHI-789', 'Ford', 'Transit', 2019, 'Gris', 'van', 15, '2023-09-20 09:15:00', '2024-03-20 09:15:00', '2024-10-15', '2024-10-15'),
('JKL-012', 'Scania', 'K360', 2022, 'Rojo', 'truck', 2, '2023-12-01 16:45:00', '2024-06-01 16:45:00', '2025-01-31', '2025-01-31'),
('MNO-345', 'Toyota', 'Hiace', 2020, 'Blanco', 'van', 8, '2023-08-10 11:20:00', '2024-02-10 11:20:00', '2024-09-30', '2024-09-30');

-- Insertar eventos de prueba (últimos 7 días)
INSERT INTO events (driver_id, vehicle_id, event_type, confidence, severity, timestamp, location, metadata) VALUES
-- Eventos de Juan Pérez (LIC001)
(1, 1, 'normal', 0.85, 'low', DATE_SUB(NOW(), INTERVAL 1 HOUR), '{"latitude": 40.7128, "longitude": -74.0060}', '{"ear": 0.28, "mar": 0.45, "head_angle": 2.5}'),
(1, 1, 'eye_closed', 0.92, 'critical', DATE_SUB(NOW(), INTERVAL 2 HOUR), '{"latitude": 40.7128, "longitude": -74.0060}', '{"ear": 0.15, "mar": 0.42, "head_angle": 1.8}'),
(1, 1, 'yawning', 0.78, 'medium', DATE_SUB(NOW(), INTERVAL 3 HOUR), '{"latitude": 40.7128, "longitude": -74.0060}', '{"ear": 0.25, "mar": 0.68, "head_angle": 3.2}'),
(1, 1, 'normal', 0.88, 'low', DATE_SUB(NOW(), INTERVAL 4 HOUR), '{"latitude": 40.7128, "longitude": -74.0060}', '{"ear": 0.30, "mar": 0.38, "head_angle": 0.5}'),

-- Eventos de María González (LIC002)
(2, 2, 'normal', 0.82, 'low', DATE_SUB(NOW(), INTERVAL 30 MINUTE), '{"latitude": 40.7589, "longitude": -73.9851}', '{"ear": 0.26, "mar": 0.40, "head_angle": 1.2}'),
(2, 2, 'head_nodding', 0.89, 'high', DATE_SUB(NOW(), INTERVAL 1.5 HOUR), '{"latitude": 40.7589, "longitude": -73.9851}', '{"ear": 0.24, "mar": 0.43, "head_angle": 25.8}'),
(2, 2, 'blinking_slow', 0.75, 'medium', DATE_SUB(NOW(), INTERVAL 2.5 HOUR), '{"latitude": 40.7589, "longitude": -73.9851}', '{"ear": 0.22, "mar": 0.41, "head_angle": 2.1}'),

-- Eventos de Carlos Rodríguez (LIC003)
(3, 3, 'normal', 0.90, 'low', DATE_SUB(NOW(), INTERVAL 15 MINUTE), '{"latitude": 40.7505, "longitude": -73.9934}', '{"ear": 0.32, "mar": 0.35, "head_angle": 0.8}'),
(3, 3, 'distraction', 0.83, 'medium', DATE_SUB(NOW(), INTERVAL 1.2 HOUR), '{"latitude": 40.7505, "longitude": -73.9934}', '{"ear": 0.28, "mar": 0.45, "head_angle": 15.3}'),
(3, 3, 'normal', 0.87, 'low', DATE_SUB(NOW(), INTERVAL 2.8 HOUR), '{"latitude": 40.7505, "longitude": -73.9934}', '{"ear": 0.29, "mar": 0.39, "head_angle": 1.5}'),

-- Eventos de Ana Martínez (LIC004)
(4, 4, 'normal', 0.91, 'low', DATE_SUB(NOW(), INTERVAL 45 MINUTE), '{"latitude": 40.7614, "longitude": -73.9776}', '{"ear": 0.31, "mar": 0.37, "head_angle": 0.9}'),
(4, 4, 'yawning', 0.86, 'medium', DATE_SUB(NOW(), INTERVAL 1.8 HOUR), '{"latitude": 40.7614, "longitude": -73.9776}', '{"ear": 0.27, "mar": 0.72, "head_angle": 2.8}'),
(4, 4, 'normal', 0.89, 'low', DATE_SUB(NOW(), INTERVAL 3.2 HOUR), '{"latitude": 40.7614, "longitude": -73.9776}', '{"ear": 0.30, "mar": 0.36, "head_angle": 1.1}'),

-- Eventos de Luis Fernández (LIC005)
(5, 5, 'normal', 0.84, 'low', DATE_SUB(NOW(), INTERVAL 20 MINUTE), '{"latitude": 40.7282, "longitude": -73.7949}', '{"ear": 0.28, "mar": 0.42, "head_angle": 1.3}'),
(5, 5, 'eye_closed', 0.95, 'critical', DATE_SUB(NOW(), INTERVAL 1.1 HOUR), '{"latitude": 40.7282, "longitude": -73.7949}', '{"ear": 0.12, "mar": 0.44, "head_angle": 0.7}'),
(5, 5, 'normal', 0.86, 'low', DATE_SUB(NOW(), INTERVAL 2.3 HOUR), '{"latitude": 40.7282, "longitude": -73.7949}', '{"ear": 0.29, "mar": 0.40, "head_angle": 1.0}');

-- Insertar alertas de prueba
INSERT INTO alerts (event_id, driver_id, vehicle_id, alert_type, severity, title, message, status, priority, metadata) VALUES
-- Alertas críticas
(2, 1, 1, 'drowsiness_critical', 'critical', 'Ojos cerrados detectados - CRÍTICO', 'Se ha detectado que el conductor Juan Pérez tiene los ojos cerrados. Confianza: 92%. Ubicación: 40.7128, -74.0060', 'sent', 5, '{"confidence": 0.92, "event_type": "eye_closed", "location": {"latitude": 40.7128, "longitude": -74.0060}}'),
(15, 5, 5, 'drowsiness_critical', 'critical', 'Ojos cerrados detectados - CRÍTICO', 'Se ha detectado que el conductor Luis Fernández tiene los ojos cerrados. Confianza: 95%. Ubicación: 40.7282, -73.7949', 'sent', 5, '{"confidence": 0.95, "event_type": "eye_closed", "location": {"latitude": 40.7282, "longitude": -73.7949}}'),

-- Alertas de alta severidad
(6, 2, 2, 'drowsiness_warning', 'high', 'Cabeza inclinada detectada', 'Se ha detectado inclinación de cabeza en el conductor María González. Confianza: 89%. Ubicación: 40.7589, -73.9851', 'delivered', 4, '{"confidence": 0.89, "event_type": "head_nodding", "location": {"latitude": 40.7589, "longitude": -73.9851}}'),

-- Alertas de severidad media
(3, 1, 1, 'drowsiness_warning', 'medium', 'Bostezo detectado', 'Se ha detectado un bostezo en el conductor Juan Pérez. Confianza: 78%. Ubicación: 40.7128, -74.0060', 'read', 3, '{"confidence": 0.78, "event_type": "yawning", "location": {"latitude": 40.7128, "longitude": -74.0060}}'),
(7, 2, 2, 'drowsiness_warning', 'medium', 'Parpadeo lento detectado', 'Se ha detectado parpadeo lento en el conductor María González. Confianza: 75%. Ubicación: 40.7589, -73.9851', 'acknowledged', 3, '{"confidence": 0.75, "event_type": "blinking_slow", "location": {"latitude": 40.7589, "longitude": -73.9851}}'),
(9, 3, 3, 'distraction_warning', 'medium', 'Distracción detectada', 'Se ha detectado distracción en el conductor Carlos Rodríguez. Confianza: 83%. Ubicación: 40.7505, -73.9934', 'pending', 3, '{"confidence": 0.83, "event_type": "distraction", "location": {"latitude": 40.7505, "longitude": -73.9934}}'),
(12, 4, 4, 'drowsiness_warning', 'medium', 'Bostezo detectado', 'Se ha detectado un bostezo en el conductor Ana Martínez. Confianza: 86%. Ubicación: 40.7614, -73.9776', 'sent', 3, '{"confidence": 0.86, "event_type": "yawning", "location": {"latitude": 40.7614, "longitude": -73.9776}}');

-- Insertar sesiones de detección de prueba
INSERT INTO detection_sessions (driver_id, vehicle_id, session_start, session_end, total_events, critical_events, average_confidence, location_start, location_end) VALUES
(1, 1, DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), 4, 1, 0.86, '{"latitude": 40.7128, "longitude": -74.0060}', '{"latitude": 40.7128, "longitude": -74.0060}'),
(2, 2, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 30 MINUTE), 3, 0, 0.82, '{"latitude": 40.7589, "longitude": -73.9851}', '{"latitude": 40.7589, "longitude": -73.9851}'),
(3, 3, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 15 MINUTE), 3, 0, 0.87, '{"latitude": 40.7505, "longitude": -73.9934}', '{"latitude": 40.7505, "longitude": -73.9934}'),
(4, 4, DATE_SUB(NOW(), INTERVAL 3.5 HOUR), DATE_SUB(NOW(), INTERVAL 45 MINUTE), 3, 0, 0.89, '{"latitude": 40.7614, "longitude": -73.9776}', '{"latitude": 40.7614, "longitude": -73.9776}'),
(5, 5, DATE_SUB(NOW(), INTERVAL 2.5 HOUR), DATE_SUB(NOW(), INTERVAL 20 MINUTE), 3, 1, 0.88, '{"latitude": 40.7282, "longitude": -73.7949}', '{"latitude": 40.7282, "longitude": -73.7949}');

-- Insertar logs del sistema de prueba
INSERT INTO system_logs (level, message, context, ip_address, user_agent) VALUES
('info', 'Sistema iniciado correctamente', '{"component": "system", "version": "1.0.0"}', '127.0.0.1', 'Sistema-Alerta/1.0.0'),
('warn', 'Evento crítico detectado para conductor 1', '{"event_id": 2, "driver_id": 1, "event_type": "eye_closed"}', '127.0.0.1', 'Vision-Service/1.0.0'),
('warn', 'Evento crítico detectado para conductor 5', '{"event_id": 15, "driver_id": 5, "event_type": "eye_closed"}', '127.0.0.1', 'Vision-Service/1.0.0'),
('info', 'Alerta enviada exitosamente', '{"alert_id": 1, "driver_id": 1, "alert_type": "drowsiness_critical"}', '127.0.0.1', 'Backend-Service/1.0.0'),
('info', 'Alerta enviada exitosamente', '{"alert_id": 2, "driver_id": 5, "alert_type": "drowsiness_critical"}', '127.0.0.1', 'Backend-Service/1.0.0');

-- Actualizar algunos eventos como procesados
UPDATE events SET is_processed = TRUE, processed_at = NOW() WHERE id IN (2, 3, 6, 7, 9, 12, 15);

-- Actualizar timestamps de alertas
UPDATE alerts SET 
    sent_at = DATE_SUB(NOW(), INTERVAL 1 HOUR),
    delivered_at = DATE_SUB(NOW(), INTERVAL 55 MINUTE),
    read_at = DATE_SUB(NOW(), INTERVAL 50 MINUTE)
WHERE id = 1;

UPDATE alerts SET 
    sent_at = DATE_SUB(NOW(), INTERVAL 1.1 HOUR),
    delivered_at = DATE_SUB(NOW(), INTERVAL 1 HOUR),
    read_at = DATE_SUB(NOW(), INTERVAL 55 MINUTE),
    acknowledged_at = DATE_SUB(NOW(), INTERVAL 50 MINUTE),
    acknowledged_by = 1,
    response = 'Conductor alertado y tomando descanso'
WHERE id = 2;

UPDATE alerts SET 
    sent_at = DATE_SUB(NOW(), INTERVAL 1.5 HOUR),
    delivered_at = DATE_SUB(NOW(), INTERVAL 1.4 HOUR)
WHERE id = 3;

UPDATE alerts SET 
    sent_at = DATE_SUB(NOW(), INTERVAL 2 HOUR),
    delivered_at = DATE_SUB(NOW(), INTERVAL 1.9 HOUR),
    read_at = DATE_SUB(NOW(), INTERVAL 1.8 HOUR)
WHERE id = 4;

UPDATE alerts SET 
    sent_at = DATE_SUB(NOW(), INTERVAL 1.8 HOUR),
    delivered_at = DATE_SUB(NOW(), INTERVAL 1.7 HOUR)
WHERE id = 5;

UPDATE alerts SET 
    sent_at = DATE_SUB(NOW(), INTERVAL 1.2 HOUR)
WHERE id = 6;

-- Mostrar resumen de datos insertados
SELECT 'Datos de prueba insertados exitosamente' as message;

SELECT 
    'Conductores' as tabla,
    COUNT(*) as registros
FROM drivers
UNION ALL
SELECT 
    'Vehículos' as tabla,
    COUNT(*) as registros
FROM vehicles
UNION ALL
SELECT 
    'Eventos' as tabla,
    COUNT(*) as registros
FROM events
UNION ALL
SELECT 
    'Alertas' as tabla,
    COUNT(*) as registros
FROM alerts
UNION ALL
SELECT 
    'Sesiones' as tabla,
    COUNT(*) as registros
FROM detection_sessions
UNION ALL
SELECT 
    'Logs del Sistema' as tabla,
    COUNT(*) as registros
FROM system_logs;

-- Mostrar estadísticas de eventos por severidad
SELECT 
    severity as severidad,
    COUNT(*) as cantidad,
    ROUND(AVG(confidence), 3) as confianza_promedio
FROM events
GROUP BY severity
ORDER BY 
    CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END;

-- Mostrar estadísticas de alertas por estado
SELECT 
    status as estado,
    COUNT(*) as cantidad,
    ROUND(AVG(priority), 2) as prioridad_promedio
FROM alerts
GROUP BY status
ORDER BY COUNT(*) DESC;
