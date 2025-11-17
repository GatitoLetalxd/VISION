-- Agregar campo usuario_id a la tabla drivers para relacionar usuarios con conductores
-- Este campo permite que cualquier usuario (admin, operator, viewer) pueda ser un conductor

USE sistema_alerta;

-- Verificar si la columna ya existe antes de agregarla
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'sistema_alerta' 
    AND TABLE_NAME = 'drivers' 
    AND COLUMN_NAME = 'usuario_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE drivers ADD COLUMN usuario_id INT NULL AFTER id, ADD INDEX idx_usuario_id (usuario_id), ADD CONSTRAINT fk_drivers_usuario FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT "La columna usuario_id ya existe en la tabla drivers" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

