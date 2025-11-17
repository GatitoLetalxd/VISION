-- Verificar estado actual de la base de datos
-- Ejecutar: mysql -u root -p sistema_alerta < verificar_estado.sql

USE sistema_alerta;

SELECT 'VERIFICACION DEL SISTEMA HIBRIDO' AS '================================';
SELECT '';

-- Verificar columna en users
SELECT 
    'Tabla: users' AS tabla,
    COLUMN_NAME as columna,
    COLUMN_TYPE as tipo,
    COLUMN_DEFAULT as valor_default
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'sistema_alerta'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'preferred_detection_model';

-- Verificar columna en drivers
SELECT 
    'Tabla: drivers' AS tabla,
    COLUMN_NAME as columna,
    COLUMN_TYPE as tipo,
    COLUMN_DEFAULT as valor_default
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'sistema_alerta'
  AND TABLE_NAME = 'drivers'
  AND COLUMN_NAME = 'preferred_detection_model';

-- Verificar tabla detection_model_settings
SELECT 
    'Tabla: detection_model_settings' AS info,
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END AS estado
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'sistema_alerta'
  AND TABLE_NAME = 'detection_model_settings';

-- Verificar tabla detection_sessions
SELECT 
    'Tabla: detection_sessions' AS info,
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END AS estado
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'sistema_alerta'
  AND TABLE_NAME = 'detection_sessions';

-- Verificar columnas en events
SELECT 
    'Tabla: events' AS tabla,
    COLUMN_NAME as columna,
    COLUMN_TYPE as tipo
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'sistema_alerta'
  AND TABLE_NAME = 'events'
  AND COLUMN_NAME IN ('detection_model', 'session_id');

-- Mostrar modelos configurados (si la tabla existe)
SELECT '' AS '';
SELECT 'MODELOS CONFIGURADOS:' AS '================================';

SELECT 
    model_name,
    is_enabled,
    display_name,
    processing_location,
    landmarks_count
FROM detection_model_settings
ORDER BY model_name;

SELECT '' AS '';
SELECT 'RESUMEN:' AS '================================';

-- Resumen general
SELECT 
    'Columna users.preferred_detection_model' AS componente,
    CASE 
        WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = 'sistema_alerta' 
              AND TABLE_NAME = 'users' 
              AND COLUMN_NAME = 'preferred_detection_model') > 0 
        THEN 'OK'
        ELSE 'FALTA'
    END AS estado
UNION ALL
SELECT 
    'Columna drivers.preferred_detection_model',
    CASE 
        WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = 'sistema_alerta' 
              AND TABLE_NAME = 'drivers' 
              AND COLUMN_NAME = 'preferred_detection_model') > 0 
        THEN 'OK'
        ELSE 'FALTA'
    END
UNION ALL
SELECT 
    'Tabla detection_model_settings',
    CASE 
        WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
              WHERE TABLE_SCHEMA = 'sistema_alerta' 
              AND TABLE_NAME = 'detection_model_settings') > 0 
        THEN 'OK'
        ELSE 'FALTA'
    END
UNION ALL
SELECT 
    'Tabla detection_sessions',
    CASE 
        WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
              WHERE TABLE_SCHEMA = 'sistema_alerta' 
              AND TABLE_NAME = 'detection_sessions') > 0 
        THEN 'OK'
        ELSE 'FALTA'
    END
UNION ALL
SELECT 
    'Columna events.detection_model',
    CASE 
        WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = 'sistema_alerta' 
              AND TABLE_NAME = 'events' 
              AND COLUMN_NAME = 'detection_model') > 0 
        THEN 'OK'
        ELSE 'FALTA'
    END
UNION ALL
SELECT 
    'Columna events.session_id',
    CASE 
        WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = 'sistema_alerta' 
              AND TABLE_NAME = 'events' 
              AND COLUMN_NAME = 'session_id') > 0 
        THEN 'OK'
        ELSE 'FALTA'
    END;

