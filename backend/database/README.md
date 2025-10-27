# Base de Datos - Sistema de Alerta Temprana

## 📊 Descripción

Este directorio contiene todos los scripts y configuraciones necesarios para la base de datos MySQL del sistema de alerta temprana.

## 🗂️ Estructura de Archivos

```
database/
├── schema.sql          # Esquema completo de la base de datos
├── seed.sql            # Datos de prueba
├── migrations/         # Scripts de migración
├── procedures/         # Procedimientos almacenados
├── views/             # Vistas de la base de datos
└── README.md          # Este archivo
```

## 🚀 Instalación

### Prerrequisitos

- MySQL 8.0 o superior
- Usuario con permisos de administrador
- Acceso a la línea de comandos de MySQL

### Pasos de Instalación

1. **Crear la base de datos:**
   ```bash
   mysql -u root -p < schema.sql
   ```

2. **Insertar datos de prueba (opcional):**
   ```bash
   mysql -u root -p < seed.sql
   ```

3. **Verificar la instalación:**
   ```bash
   mysql -u root -p -e "USE sistema_alerta; SHOW TABLES;"
   ```

## 📋 Esquema de la Base de Datos

### Tablas Principales

#### `users`
Almacena información de usuarios del sistema (administradores, operadores, visualizadores).

**Campos principales:**
- `id`: Identificador único
- `email`: Email del usuario (único)
- `password`: Contraseña encriptada
- `first_name`, `last_name`: Nombre completo
- `role`: Rol del usuario (admin, operator, viewer)
- `is_active`: Estado activo/inactivo
- `refresh_token`: Token de renovación JWT

#### `drivers`
Información de conductores registrados en el sistema.

**Campos principales:**
- `id`: Identificador único
- `license_number`: Número de licencia (único)
- `first_name`, `last_name`: Nombre completo
- `phone`, `email`: Contacto
- `date_of_birth`: Fecha de nacimiento
- `license_expiry`: Vencimiento de licencia
- `alert_threshold`: Umbral de alerta personalizado
- `emergency_contact`: Contacto de emergencia

#### `vehicles`
Información de vehículos del sistema.

**Campos principales:**
- `id`: Identificador único
- `plate_number`: Número de placa (único)
- `make`, `model`, `year`: Información del vehículo
- `vehicle_type`: Tipo de vehículo (bus, truck, van, car, motorcycle)
- `capacity`: Capacidad de pasajeros
- `last_maintenance`, `next_maintenance`: Fechas de mantenimiento
- `insurance_expiry`, `registration_expiry`: Vencimientos

#### `events`
Eventos de detección de somnolencia capturados por el servicio de visión.

**Campos principales:**
- `id`: Identificador único
- `driver_id`: Referencia al conductor
- `vehicle_id`: Referencia al vehículo
- `event_type`: Tipo de evento (eye_closed, head_nodding, yawning, etc.)
- `confidence`: Nivel de confianza (0.0 - 1.0)
- `severity`: Severidad (low, medium, high, critical)
- `timestamp`: Momento del evento
- `location`: Coordenadas GPS (JSON)
- `image_path`: Ruta de imagen capturada
- `metadata`: Datos adicionales (EAR, MAR, etc.)

#### `alerts`
Alertas generadas a partir de eventos de somnolencia.

**Campos principales:**
- `id`: Identificador único
- `event_id`: Referencia al evento
- `driver_id`: Referencia al conductor
- `vehicle_id`: Referencia al vehículo
- `alert_type`: Tipo de alerta
- `severity`: Severidad de la alerta
- `title`, `message`: Contenido de la alerta
- `status`: Estado (pending, sent, delivered, read, acknowledged)
- `priority`: Prioridad (1-5)
- `response`: Respuesta del conductor/supervisor

### Tablas Auxiliares

#### `detection_sessions`
Sesiones de detección por conductor/vehículo.

#### `system_config`
Configuraciones del sistema.

#### `system_logs`
Logs de auditoría del sistema.

## 🔍 Vistas Útiles

### `v_driver_stats`
Estadísticas por conductor:
- Total de eventos
- Eventos críticos
- Promedio de confianza
- Último evento
- Alertas pendientes

### `v_vehicle_stats`
Estadísticas por vehículo:
- Total de eventos
- Eventos críticos
- Estado de mantenimiento
- Último evento

### `v_recent_alerts`
Alertas recientes (últimas 24 horas) con información de conductor y vehículo.

## ⚙️ Procedimientos Almacenados

### `CleanupOldEvents(days_to_keep)`
Limpia eventos antiguos y alertas procesadas.

**Uso:**
```sql
CALL CleanupOldEvents(30); -- Mantener últimos 30 días
```

### `GenerateDriverReport(driver_id, start_date, end_date)`
Genera reporte detallado de un conductor.

**Uso:**
```sql
CALL GenerateDriverReport(1, '2024-01-01', '2024-01-31');
```

## 🔧 Configuración

### Usuario de Aplicación

El script crea automáticamente un usuario para la aplicación:

- **Usuario:** `alerta_user`
- **Host:** `localhost`
- **Contraseña:** `secure_password_123`

**⚠️ IMPORTANTE:** Cambiar la contraseña en producción.

### Permisos

El usuario tiene permisos para:
- SELECT, INSERT, UPDATE, DELETE en todas las tablas
- Ejecutar procedimientos almacenados
- Acceso completo a la base de datos `sistema_alerta`

## 📊 Índices de Rendimiento

### Índices Principales
- `idx_events_driver_timestamp`: Optimiza consultas por conductor y tiempo
- `idx_events_severity_timestamp`: Optimiza consultas por severidad
- `idx_alerts_status_created`: Optimiza consultas de alertas por estado
- `idx_alerts_driver_status`: Optimiza consultas de alertas por conductor

### Índices de Búsqueda
- `idx_drivers_license_number`: Búsqueda por número de licencia
- `idx_vehicles_plate_number`: Búsqueda por número de placa
- `idx_users_email`: Búsqueda por email de usuario

## 🔒 Seguridad

### Encriptación
- Contraseñas encriptadas con bcrypt
- Tokens JWT para autenticación
- Campos sensibles marcados para encriptación

### Validaciones
- Constraints de formato para emails y teléfonos
- Validación de rangos para confianza y prioridades
- Validación de fechas y edades

### Auditoría
- Soft delete en todas las tablas principales
- Timestamps automáticos (created_at, updated_at)
- Logs de eventos críticos
- Triggers de auditoría

## 🧪 Datos de Prueba

El script `seed.sql` incluye:

- **5 conductores** con información completa
- **5 vehículos** de diferentes tipos
- **15 eventos** de los últimos días
- **6 alertas** con diferentes estados
- **5 sesiones** de detección
- **5 logs** del sistema

## 📈 Monitoreo

### Consultas Útiles

**Eventos por severidad:**
```sql
SELECT severity, COUNT(*) as cantidad
FROM events 
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY severity;
```

**Alertas pendientes:**
```sql
SELECT COUNT(*) as alertas_pendientes
FROM alerts 
WHERE status = 'pending';
```

**Conductores más activos:**
```sql
SELECT d.license_number, COUNT(e.id) as eventos
FROM drivers d
LEFT JOIN events e ON d.id = e.driver_id
WHERE e.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY d.id
ORDER BY eventos DESC;
```

## 🔄 Mantenimiento

### Limpieza Regular
```sql
-- Limpiar eventos antiguos (mantener 30 días)
CALL CleanupOldEvents(30);

-- Limpiar logs antiguos
DELETE FROM system_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### Optimización
```sql
-- Analizar tablas
ANALYZE TABLE events, alerts, drivers, vehicles;

-- Optimizar tablas
OPTIMIZE TABLE events, alerts, drivers, vehicles;
```

## 🚨 Resolución de Problemas

### Error de Conexión
```bash
# Verificar que MySQL esté ejecutándose
sudo systemctl status mysql

# Verificar usuario y permisos
mysql -u alerta_user -p -e "SHOW GRANTS;"
```

### Error de Permisos
```sql
-- Otorgar permisos adicionales si es necesario
GRANT ALL PRIVILEGES ON sistema_alerta.* TO 'alerta_user'@'localhost';
FLUSH PRIVILEGES;
```

### Problemas de Rendimiento
```sql
-- Verificar índices
SHOW INDEX FROM events;
SHOW INDEX FROM alerts;

-- Verificar consultas lentas
SHOW PROCESSLIST;
```

## 📚 Referencias

- [MySQL 8.0 Documentation](https://dev.mysql.com/doc/refman/8.0/en/)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
- [MySQL Security](https://dev.mysql.com/doc/refman/8.0/en/security.html)
