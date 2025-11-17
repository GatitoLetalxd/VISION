# SISTEMA HIBRIDO DE DETECCION - VISION

Sistema de deteccion de somnolencia con soporte para multiples modelos de IA

---

## INDICE

1. [Vision General](#vision-general)
2. [Modelos Disponibles](#modelos-disponibles)
3. [Arquitectura](#arquitectura)
4. [Configuracion](#configuracion)
5. [Uso](#uso)
6. [API Backend](#api-backend)
7. [Frontend](#frontend)
8. [Base de Datos](#base-de-datos)
9. [Migracion](#migracion)

---

## VISION GENERAL

El sistema VISION ahora soporta dos modelos de deteccion diferentes:

1. **face-api.js** (JavaScript) - Procesamiento en navegador
2. **MediaPipe** (Python) - Procesamiento en servidor

Cada usuario puede seleccionar el modelo que prefiera segun sus necesidades de precision, privacidad y recursos disponibles.

---

## MODELOS DISPONIBLES

### Modelo 1: face-api.js (JavaScript)

**Tecnologia:**
- face-api.js 0.22.2
- TensorFlow.js 4.22.0
- WebGL acceleration

**Caracteristicas:**
- Procesamiento: 100% en navegador (cliente)
- Landmarks: 68 puntos faciales
- Latencia: aproximadamente 80ms por frame
- GPU: Opcional (WebGL)
- Privacidad: GDPR compliant (procesamiento local)
- Costo: $0 (sin servidor)

**Algoritmos:**
- Eye Aspect Ratio (EAR)
- Mouth Aspect Ratio (MAR)
- Deteccion de ojos cerrados
- Deteccion de bostezos

**Casos de uso:**
- Aplicaciones donde la privacidad es critica
- Despliegues sin infraestructura de servidor IA
- Usuarios con hardware limitado en servidor
- Aplicaciones que requieren escalabilidad infinita

---

### Modelo 2: MediaPipe (Python)

**Tecnologia:**
- MediaPipe Face Mesh
- OpenCV
- FastAPI
- NumPy, SciPy

**Caracteristicas:**
- Procesamiento: Servidor Python
- Landmarks: 468 puntos faciales
- Latencia: aproximadamente 120ms por frame (incluye red)
- GPU: Opcional pero recomendada
- Privacidad: Requiere envio de frames al servidor
- Costo: ~$5/hora servidor con GPU

**Algoritmos:**
- Eye Aspect Ratio (EAR)
- Mouth Aspect Ratio (MAR)
- Head Pose Estimation (inclinacion de cabeza)
- Head Nodding Detection (cabeceo)
- Slow Blinking Detection (parpadeo lento)
- Distraction Detection (distracciones)
- Temporal Analysis (historial de 30 frames)

**Casos de uso:**
- Aplicaciones que requieren maxima precision
- Analisis profesional de conductores
- Flotas comerciales con presupuesto
- Sistemas con requisitos de deteccion avanzada

---

## ARQUITECTURA

### Flujo General

```
Usuario selecciona modelo
      |
      v
+-----+-----+
|           |
| face-api  | MediaPipe
|           |
+-----+-----+
      |
      v
Frontend React
      |
      v
Deteccion en vivo
      |
      v
Eventos → Backend Node.js → MySQL
```

### Arquitectura Detallada

**Opcion A: face-api.js (JavaScript)**

```
Usuario
  |
  v
Navegador (Cliente)
  |
  +-- Video stream (MediaStream)
  |
  +-- face-api.js
       |
       +-- TinyFaceDetector
       +-- FaceLandmark68Net
       +-- Algoritmos EAR/MAR
       |
       v
  Metricas (EAR, MAR, etc)
       |
       v
  Socket.IO → Backend Node.js → MySQL
```

**Opcion B: MediaPipe (Python)**

```
Usuario
  |
  v
Navegador (Cliente)
  |
  +-- Video stream (MediaStream)
  |
  +-- Captura frame → Base64
       |
       v
  HTTP POST
       |
       v
Servidor Python (FastAPI)
  |
  +-- MediaPipe Face Mesh
  +-- Algoritmos EAR/MAR/HeadPose
  |
  v
  Resultado de deteccion
       |
       v
  Response → Cliente
       |
       v
  Socket.IO → Backend Node.js → MySQL
```

---

## CONFIGURACION

### 1. Base de Datos

Ejecutar el script SQL:

```bash
cd /var/www/VISION
mysql -u root -p sistema_alerta < backend/database/add_detection_model_config.sql
```

Esto crea:
- Columna `preferred_detection_model` en tabla `users`
- Columna `preferred_detection_model` en tabla `drivers`
- Tabla `detection_model_settings`
- Tabla `detection_sessions`
- Columna `detection_model` en tabla `events`

### 2. Backend Node.js

El backend ya esta configurado con las nuevas rutas:

```javascript
// /api/detection/models - Obtener modelos disponibles
// /api/detection/models/:modelName - Obtener modelo especifico
// /api/detection/preference - Obtener/actualizar preferencia
// /api/detection/sessions - Crear/finalizar sesion
// /api/detection/statistics - Estadisticas de uso
```

### 3. Servicio Python (MediaPipe)

Configurar el servicio Python:

```bash
cd /var/www/VISION/vision-service

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp env.example .env
nano .env
```

Archivo `.env`:

```bash
# Backend
BACKEND_URL=https://localhost:5005
BACKEND_API_KEY=tu_api_key_segura_aqui

# Servidor
HOST=0.0.0.0
PORT=8000

# MediaPipe
MEDIAPIPE_NUM_FACES=1
MEDIAPIPE_MIN_DETECTION_CONFIDENCE=0.5
MEDIAPIPE_MIN_TRACKING_CONFIDENCE=0.5

# Umbrales
EYE_AR_THRESHOLD=0.29
MAR_THRESHOLD=0.45
EAR_CONSECUTIVE_FRAMES=2
MAR_CONSECUTIVE_FRAMES=2
DROWSINESS_THRESHOLD=0.7
CRITICAL_THRESHOLD=0.9
```

Iniciar servicio:

```bash
# Desarrollo
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Produccion con SSL
uvicorn main:app --host 0.0.0.0 --port 8000 \
  --ssl-keyfile=.cert/key.pem \
  --ssl-certfile=.cert/cert.pem
```

### 4. Frontend React

Configurar variable de entorno:

```bash
# .env o .env.local
VITE_PYTHON_SERVICE_URL=https://localhost:8000
```

---

## USO

### Para Usuarios

1. **Acceder a configuracion:**
   - Dashboard → Configuracion → Modelo de Deteccion

2. **Seleccionar modelo:**
   - Elegir entre face-api.js o MediaPipe
   - Ver detalles de cada modelo
   - Guardar preferencia

3. **Iniciar deteccion:**
   - Ir a Deteccion de Somnolencia
   - El modelo seleccionado se usara automaticamente
   - Las metricas se ajustaran segun el modelo

### Para Administradores

1. **Habilitar/deshabilitar modelos:**
   ```http
   PUT /api/detection/models/mediapipe
   {
     "is_enabled": false
   }
   ```

2. **Ver estadisticas:**
   ```http
   GET /api/detection/statistics
   ```
   
   Respuesta:
   ```json
   {
     "statistics": [
       {
         "detection_model": "face-api",
         "total_sessions": 150,
         "total_frames": 450000,
         "total_events": 234,
         "avg_confidence": 0.87,
         "avg_latency": 85,
         "avg_duration_minutes": 25
       },
       {
         "detection_model": "mediapipe",
         "total_sessions": 50,
         "total_frames": 180000,
         "total_events": 105,
         "avg_confidence": 0.92,
         "avg_latency": 125,
         "avg_duration_minutes": 30
       }
     ]
   }
   ```

---

## API BACKEND

### Obtener modelos disponibles

```http
GET /api/detection/models
Authorization: Bearer {token}
```

Respuesta:
```json
{
  "success": true,
  "models": [
    {
      "id": 1,
      "model_name": "face-api",
      "is_enabled": true,
      "display_name": "face-api.js (JavaScript)",
      "description": "Deteccion en navegador usando TensorFlow.js",
      "processing_location": "client",
      "landmarks_count": 68,
      "avg_latency_ms": 80,
      "requires_gpu": false,
      "max_concurrent_users": null,
      "cost_per_hour": 0.00
    },
    {
      "id": 2,
      "model_name": "mediapipe",
      "is_enabled": true,
      "display_name": "MediaPipe (Python)",
      "description": "Deteccion en servidor usando MediaPipe",
      "processing_location": "server",
      "landmarks_count": 468,
      "avg_latency_ms": 120,
      "requires_gpu": false,
      "max_concurrent_users": 50,
      "cost_per_hour": 5.00
    }
  ]
}
```

### Obtener preferencia del usuario

```http
GET /api/detection/preference
Authorization: Bearer {token}
```

Respuesta:
```json
{
  "success": true,
  "preferred_model": "face-api"
}
```

### Actualizar preferencia

```http
PUT /api/detection/preference
Authorization: Bearer {token}
Content-Type: application/json

{
  "preferred_model": "mediapipe"
}
```

### Crear sesion de deteccion

```http
POST /api/detection/sessions
Authorization: Bearer {token}
Content-Type: application/json

{
  "driver_id": 1,
  "vehicle_id": 2,
  "detection_model": "mediapipe"
}
```

Respuesta:
```json
{
  "success": true,
  "message": "Sesion de deteccion creada",
  "session_id": 42
}
```

### Finalizar sesion

```http
PUT /api/detection/sessions/42/end
Authorization: Bearer {token}
Content-Type: application/json

{
  "total_frames": 18000,
  "total_events": 15,
  "avg_confidence": 0.89,
  "avg_latency": 125,
  "notes": "Sesion completada exitosamente"
}
```

---

## FRONTEND

### Usar el hook useDetectionModel

```typescript
import { useDetectionModel } from '../hooks/useDetectionModel';

function DetectionComponent() {
  const {
    currentModel,
    availableModels,
    loading,
    sessionId,
    changeModel,
    startSession,
    endSession,
    isMediaPipe,
    isFaceApi
  } = useDetectionModel();

  // Cambiar modelo
  const handleModelChange = async (newModel: 'face-api' | 'mediapipe') => {
    await changeModel(newModel);
  };

  // Iniciar sesion
  const handleStartDetection = async () => {
    const driverId = 1;
    const vehicleId = 2;
    const sessionId = await startSession(driverId, vehicleId);
    // ... iniciar deteccion
  };

  // Finalizar sesion
  const handleStopDetection = async () => {
    await endSession({
      totalFrames: 18000,
      totalEvents: 15,
      avgConfidence: 0.89,
      avgLatency: 125
    });
  };

  return (
    <div>
      <p>Modelo actual: {currentModel}</p>
      {isMediaPipe && <p>Usando MediaPipe (servidor)</p>}
      {isFaceApi && <p>Usando face-api.js (cliente)</p>}
    </div>
  );
}
```

### Componente DetectionModelSelector

```typescript
import { DetectionModelSelector } from '../components/DetectionModelSelector';

function Settings() {
  const [selectedModel, setSelectedModel] = useState<'face-api' | 'mediapipe'>('face-api');

  return (
    <DetectionModelSelector
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
      showDetails={true}
    />
  );
}
```

---

## BASE DE DATOS

### Tabla: detection_model_settings

```sql
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabla: detection_sessions

```sql
CREATE TABLE detection_sessions (
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
    FOREIGN KEY (driver_id) REFERENCES drivers(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## MIGRACION

### Desde sistema anterior (solo face-api.js)

1. **Ejecutar migracion SQL:**
   ```bash
   mysql -u root -p sistema_alerta < backend/database/add_detection_model_config.sql
   ```

2. **Actualizar backend:**
   ```bash
   cd /var/www/VISION/backend
   npm install
   pm2 restart vision-backend
   ```

3. **Actualizar frontend:**
   ```bash
   cd /var/www/VISION
   npm install
   npm run build
   pm2 restart vision-frontend
   ```

4. **Opcional: Instalar servicio Python:**
   ```bash
   cd /var/www/VISION/vision-service
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Configurar PM2 para Python:**
   ```javascript
   // ecosystem.config.cjs
   {
     name: 'vision-python',
     script: 'venv/bin/uvicorn',
     args: 'main:app --host 0.0.0.0 --port 8000',
     cwd: '/var/www/VISION/vision-service',
     watch: false,
     env: {
       NODE_ENV: 'production'
     }
   }
   ```

   ```bash
   pm2 start ecosystem.config.cjs --only vision-python
   pm2 save
   ```

---

## COMPARACION DE MODELOS

### Matriz de Decision

| Criterio | face-api.js | MediaPipe |
|----------|-------------|-----------|
| Precision | Alta (68 landmarks) | Muy Alta (468 landmarks) |
| Latencia | Baja (80ms) | Media (120ms) |
| Privacidad | Excelente (local) | Media (servidor) |
| Costo | $0 | $5/hora |
| Escalabilidad | Infinita | Limitada (50 usuarios) |
| Head Pose | No | Si |
| Slow Blinking | No | Si |
| GPU Requerida | No | Opcional |
| GDPR | Compliant | Requiere config |

### Recomendaciones

**Usar face-api.js cuando:**
- La privacidad es critica
- No hay presupuesto para servidor IA
- Se requiere escalabilidad infinita
- Los usuarios tienen hardware moderno

**Usar MediaPipe cuando:**
- Se requiere maxima precision
- El presupuesto permite servidor GPU
- Se necesita deteccion de postura de cabeza
- Es aceptable enviar frames al servidor
- Usuarios concurrentes < 50

---

## SOLUCIÓN DE PROBLEMAS

### Problema: MediaPipe no responde

**Verificar servicio:**
```bash
# Ver logs
pm2 logs vision-python

# Reiniciar
pm2 restart vision-python

# Verificar puerto
netstat -tuln | grep 8000
```

**Verificar conectividad:**
```bash
# Desde el navegador
curl https://localhost:8000/health

# Debe responder:
{"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### Problema: face-api.js no carga modelos

**Verificar modelos:**
```bash
ls -lh /var/www/VISION/public/models/
```

**Debe contener:**
- tiny_face_detector_model-weights_manifest.json
- face_landmark_68_model-weights_manifest.json
- face_recognition_model-weights_manifest.json

### Problema: Usuario no puede cambiar modelo

**Verificar permisos:**
```sql
SELECT id, email, rol, preferred_detection_model 
FROM users 
WHERE email = 'usuario@ejemplo.com';
```

**Actualizar manualmente:**
```sql
UPDATE users 
SET preferred_detection_model = 'mediapipe' 
WHERE id = 1;
```

---

## MONITOREO

### Metricas a monitorear

1. **Uso de modelos:**
   - Sesiones por modelo
   - Eventos por modelo
   - Latencia promedio

2. **Rendimiento:**
   - Frames procesados por segundo
   - Tasa de eventos detectados
   - Confianza promedio

3. **Recursos:**
   - CPU/GPU uso (MediaPipe)
   - Memoria (ambos)
   - Ancho de banda (MediaPipe)

### Dashboard de monitoreo

```sql
-- Sesiones activas por modelo
SELECT detection_model, COUNT(*) as active_sessions
FROM detection_sessions
WHERE ended_at IS NULL
GROUP BY detection_model;

-- Rendimiento ultimo mes
SELECT 
  detection_model,
  COUNT(*) as total_sessions,
  AVG(total_frames_processed) as avg_frames,
  AVG(total_events) as avg_events,
  AVG(avg_confidence) as avg_confidence,
  AVG(avg_latency_ms) as avg_latency
FROM detection_sessions
WHERE started_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
GROUP BY detection_model;
```

---

## SEGURIDAD

### face-api.js (Cliente)

- Procesamiento 100% local
- Sin transmision de video
- Solo metricas numericas al backend
- GDPR compliant por defecto

### MediaPipe (Servidor)

**Consideraciones:**
- Frames de video se envian al servidor
- Requiere consentimiento explicito
- Implementar: (https://localhost:8000/health)
  - HTTPS obligatorio
  - Autenticacion por API key
  - Rate limiting
  - No almacenar frames
  - Logs anonimizados

**Configuracion segura:**
```python
# main.py
from fastapi import Security, HTTPException
from fastapi.security.api_key import APIKeyHeader

API_KEY_HEADER = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Security(API_KEY_HEADER)):
    if api_key != settings.backend_api_key:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key

@app.post("/detect")
async def detect(request: DetectionRequest, api_key: str = Depends(verify_api_key)):
    # ... deteccion
```

---

## ROADMAP

### Version 1.1 (Actual)
- Sistema hibrido basico
- Seleccion de modelo por usuario
- Estadisticas de uso

### Version 1.2 (Proximo)
- Cambio automatico de modelo segun carga
- Cache inteligente de resultados
- Optimizacion de latencia MediaPipe

### Version 1.3 (Futuro)
- Modelo hibrido (combinar ambos)
- Edge computing (procesamiento local avanzado)
- Soporte para modelos custom

---

**Autor:** Rogeero Daniel Montufar Merma
**Proyecto:** VISION - Sistema de Deteccion de Somnolencia
**Version:** 1.1.0 - Sistema Hibrido
**Fecha:** Noviembre 2025

