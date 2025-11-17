-- Agregar rol 'driver' al ENUM de roles en la tabla users
-- Este script es seguro y verifica antes de hacer cambios

USE sistema_alerta;

-- Verificar si el rol 'driver' ya existe
SET @role_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'sistema_alerta' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'role'
    AND COLUMN_TYPE LIKE '%driver%'
);

-- Si el rol no existe, modificar la columna
SET @sql = IF(@role_exists = 0,
    'ALTER TABLE users MODIFY COLUMN role ENUM(''admin'', ''operator'', ''viewer'', ''driver'') NOT NULL DEFAULT ''driver''',
    'SELECT "El rol driver ya existe en la tabla users" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar el cambio
SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_alerta' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'role';

