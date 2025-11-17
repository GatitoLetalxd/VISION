# VISION - Sistema de Detección de Somnolencia

Sistema inteligente de detección de somnolencia en conductores en tiempo real utilizando visión por computadora y aprendizaje profundo.

## Autor

**Rogeero Daniel Montufar Merma**

GitHub: https://github.com/GatitoLetalxd

## Descripción

VISION es un sistema web avanzado de detección de somnolencia en tiempo real diseñado para prevenir accidentes de tránsito causados por fatiga del conductor. Utiliza tecnologías de visión por computadora y aprendizaje profundo para analizar el estado de alerta del conductor mediante la cámara del dispositivo.

### Problema que Resuelve

- Aproximadamente 20% de los accidentes de tránsito son causados por somnolencia
- 1.25 millones de personas mueren anualmente en accidentes de tránsito (OMS)
- La somnolencia reduce el tiempo de reacción hasta en 50%

### Solución

Sistema de monitoreo no invasivo que detecta signos de somnolencia mediante:
- Análisis del parpadeo y cierre de ojos
- Detección de bostezos
- Monitoreo de métricas faciales en tiempo real
- Alertas sonoras ante situaciones críticas

## Características

### Detección en Tiempo Real

- Procesamiento en vivo: 10 FPS con latencia menor a 100ms
- Eye Aspect Ratio (EAR): Algoritmo científico validado para detección de ojos cerrados
- Mouth Aspect Ratio (MAR): Detección precisa de bostezos
- Detección facial robusta: TinyFaceDetector optimizado para tiempo real
- 68 Facial Landmarks: Tracking preciso de puntos faciales clave

### Interfaz Intuitiva

- Métricas en tiempo real: Visualización de EAR, MAR, nivel de somnolencia
- Overlay visual: Indicadores en video con bounding box y landmarks
- Estadísticas de sesión: Contadores de eventos y alertas
- Alertas sonoras: Tono crítico para eventos de alta prioridad
- Tema oscuro: Interfaz moderna con Material-UI

### Sistema de Gestión

- RBAC (Control de Acceso Basado en Roles):
  - Admin: Gestión completa del sistema y usuarios
  - Operador: Monitoreo y gestión de conductores
  - Viewer: Visualización de datos
  - Driver: Conductores que utilizan el sistema de detección
- Gestión de conductores: CRUD completo con perfil detallado
- Gestión de vehículos: Asociación conductor-vehículo
- Dashboard analítico: Estadísticas y gráficos en tiempo real
- Autenticación JWT: Seguridad de sesiones
- Monitoreo en vivo: Visualización de múltiples conductores en tiempo real
- Procesamiento de video: Análisis detallado de videos grabados

### Privacidad y Seguridad

- Procesamiento local: face-api.js ejecuta 100% en navegador
- No almacenamiento de video: Solo se transmiten métricas numéricas
- GDPR Compliant: Privacy by Design
- Encriptación: HTTPS/WSS en producción
- Rate Limiting: Protección contra ataques

## Arquitectura

### Componentes Principales

**Frontend (Cliente)**
- React 18 + TypeScript + Vite
- Material-UI para componentes
- face-api.js (TensorFlow.js) para detección facial
- Socket.IO Client para comunicación en tiempo real
- Algoritmos personalizados (EAR, MAR, Lógica de Somnolencia)

**Backend (Servidor)**
- Node.js + Express.js
- Autenticación JWT + bcrypt
- Autorización RBAC (Middleware)
- REST API (Drivers, Vehicles, Users, Alerts, Detection Models)
- Socket.IO para eventos en tiempo real
- Seguridad (Helmet, CORS, Rate Limiting)
- File Uploads (Multer - Profile Photos)

**Base de Datos**
- MySQL 8.0
- Tablas: users, drivers, vehicles, alerts, events, detection_sessions, detection_model_settings

**Servicio Python (Opcional)**
- FastAPI con MediaPipe para detección alternativa
- Procesamiento en servidor como alternativa a face-api.js

### Flujo de Detección

1. Cámara captura video stream
2. face-api.js procesa frames con TinyFaceDetector
3. FaceLandmark68Net extrae 68 puntos faciales
4. Algoritmo EAR calcula ratio de ojos
5. Algoritmo MAR calcula ratio de boca
6. Lógica de somnolencia evalúa métricas
7. Actualización de UI, envío de eventos Socket.IO y alertas sonoras si es crítico

## Tecnologías Utilizadas

### Frontend

- React 18.2.0
- TypeScript 5.3.3
- Vite 5.1.3
- Material-UI 5.15.10
- face-api.js 0.22.2
- TensorFlow.js 4.22.0
- Socket.IO Client 4.8.1
- Axios 1.6.7
- Framer Motion 11.0.5
- Chart.js 4.5.1
- React Chart.js 2 5.3.1

### Backend

- Node.js 20.x
- Express.js 4.18.2
- MySQL2 3.9.1
- Socket.IO 4.7.4
- JWT (jsonwebtoken 9.0.2)
- bcrypt 5.1.1
- Helmet 7.1.0
- Multer 1.4.5-lts.1
- express-rate-limit
- @tensorflow/tfjs-node

### Base de Datos

- MySQL 8.0

### Modelos de IA

- TinyFaceDetector (MobileNet-based)
- FaceLandmark68Net (iBUG 300-W)
- FaceRecognitionNet (ResNet-34)
- MediaPipe Face Detection (alternativa en servidor)

## Instalación

### Prerrequisitos

- Node.js 20.x o superior
- MySQL 8.0 o superior
- npm o yarn
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/GatitoLetalxd/VISION.git
cd VISION
```

### 2. Configurar Base de Datos

```sql
-- Crear base de datos
CREATE DATABASE sistema_alerta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar base de datos
USE sistema_alerta;

-- Importar schema
source backend/database/schema.sql
```

### 3. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

**Archivo `.env` del backend:**

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sistema_alerta
DB_PORT=3306

# JWT
JWT_SECRET=tu_secret_key_super_segura_aqui

# Server
PORT=5005
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://tu-dominio.com,https://localhost:5173
```

```bash
# Iniciar backend con PM2
pm2 start ecosystem.config.cjs --name vision-backend

# O iniciar en modo desarrollo
npm run dev
```

### 4. Frontend

```bash
cd ..  # Volver a la raíz del proyecto

# Instalar dependencias
npm install

# Iniciar frontend
npm run dev
```

### 5. Servicio Python (Opcional)

```bash
cd vision-service

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servicio
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 6. Acceder a la aplicación

```
Frontend: http://localhost:5175
Backend API: http://localhost:5005
Python Service: http://localhost:8000
```

## Uso

### 1. Crear Usuario Admin (Primera vez)

El sistema permite registro de usuarios. El primer usuario registrado puede ser promovido a admin mediante la base de datos:

```sql
USE sistema_alerta;
UPDATE users SET role = 'admin' WHERE email = 'tu_email@ejemplo.com';
```

### 2. Login

- Ir a: http://localhost:5175
- Registrar nuevo usuario o iniciar sesión
- Los nuevos usuarios se registran con rol 'driver' por defecto

### 3. Gestionar Usuarios (Admin)

- Dashboard -> Gestión de Usuarios (solo admin)
- Crear operadores, viewers y conductores
- Cambiar roles y estados

### 4. Iniciar Detección de Somnolencia

- Dashboard -> Detección de Somnolencia
- Seleccionar modelo de detección (face-api.js o MediaPipe)
- Click en Iniciar Detección
- Permitir acceso a cámara
- El sistema comenzará a monitorear

### 5. Monitoreo en Vivo (Admin)

- Dashboard -> Monitoreo en Vivo
- Visualizar múltiples conductores en tiempo real
- Ver métricas y video streams de conductores activos

### 6. Procesamiento de Video

- Dashboard -> Procesamiento de Video
- Subir video grabado
- Analizar video para detección detallada
- Ver resultados con gráficos y timeline

### 7. Ver Estadísticas

- Dashboard -> Estadísticas
- Ver alertas, conductores, eventos en tiempo real

## Algoritmos Implementados

### Eye Aspect Ratio (EAR)

Basado en el paper de Soukupová & Čech (2016).

```
EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)

Donde:
- p1, p4: Puntos horizontales del ojo
- p2, p3, p5, p6: Puntos verticales del ojo

Umbral: EAR < 0.29 indica ojos cerrados
```

### Mouth Aspect Ratio (MAR)

Adaptación del EAR para la boca.

```
MAR = (||p51-p59|| + ||p53-p57|| + ||p55-p59||) / (2 * ||p49-p55||)

Donde:
- p49, p55: Puntos horizontales de la boca
- p51, p53, p55, p57, p59: Puntos verticales

Umbral: MAR > 0.45 indica bostezo
```

### Detección de Somnolencia

```
if (EAR < 0.29 durante 2 frames) → Ojos cerrados
if (MAR > 0.45 durante 1 frame) → Bostezo
if (Ojos cerrados y Bostezo) → CRÍTICO + Alerta sonora
if (Ojos cerrados > 10 frames) → ALTA somnolencia
```

### Detección Relativa

El sistema también utiliza detección relativa basada en el baseline EAR del usuario:
- Calcula un promedio móvil de los últimos 10 valores EAR
- Si el EAR actual baja más del 20% respecto al baseline, se detecta como ojos cerrados
- Esto permite adaptarse a diferentes usuarios y condiciones de iluminación

## Seguridad y Privacidad

### Privacy by Design

- Procesamiento local: face-api.js ejecuta 100% en el navegador
- No almacenamiento de video: Solo métricas numéricas (EAR, MAR)
- GDPR Compliant: Art. 9, 25, 32
- Consentimiento explícito: Usuario autoriza cámara
- Minimización de datos: Solo datos esenciales

### Seguridad del Backend

- JWT: Tokens seguros con expiración
- bcrypt: Hash de contraseñas (10 rounds)
- Helmet: Headers de seguridad HTTP
- CORS: Orígenes permitidos configurables
- Rate Limiting: 500 req/15min
- HTTPS/WSS: Encriptación en producción
- SQL Prepared Statements: Prevención de SQL Injection
- RBAC: Control de acceso basado en roles

## Estructura del Proyecto

```
VISION/
├── backend/                 # Servidor Node.js/Express
│   ├── src/
│   │   ├── controllers/    # Controladores de rutas
│   │   ├── middlewares/     # Middlewares (auth, authorize)
│   │   ├── routes/         # Definición de rutas
│   │   ├── services/       # Servicios de negocio
│   │   ├── config/         # Configuración (database, etc.)
│   │   └── server.js       # Punto de entrada del servidor
│   ├── database/            # Scripts SQL
│   │   ├── schema.sql      # Esquema de base de datos
│   │   └── migrations/     # Migraciones
│   └── package.json
├── src/                     # Frontend React
│   ├── components/         # Componentes reutilizables
│   ├── pages/              # Páginas de la aplicación
│   ├── services/           # Servicios (API, socket, detección)
│   ├── hooks/              # Custom hooks
│   ├── types/              # Definiciones TypeScript
│   ├── config/             # Configuración frontend
│   └── App.tsx             # Componente principal
├── vision-service/         # Servicio Python (MediaPipe)
│   ├── main.py            # FastAPI application
│   └── requirements.txt
├── public/                 # Archivos estáticos
│   └── models/            # Modelos de face-api.js
├── package.json
├── vite.config.ts
└── README.md
```

## Scripts Disponibles

### Frontend

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Construir para producción
npm run preview  # Previsualizar build de producción
npm run lint     # Ejecutar linter
```

### Backend

```bash
npm run dev      # Iniciar en modo desarrollo
npm start        # Iniciar en modo producción
```

## Configuración de Puertos

- Frontend: 5175
- Backend: 5005
- Python Service: 8000

## Contribuir

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (git checkout -b feature/AmazingFeature)
3. Commit tus cambios (git commit -m 'feat: Add AmazingFeature')
4. Push a la rama (git push origin feature/AmazingFeature)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT.

Copyright (c) 2025 Rogeero Daniel Montufar Merma

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Referencias

- Soukupová, T., & Čech, J. (2016). Real-Time Eye Blink Detection using Facial Landmarks. CVWW 2016.
- face-api.js: https://github.com/justadudewhohacks/face-api.js
- TensorFlow.js: https://www.tensorflow.org/js
- MediaPipe: https://mediapipe.dev/

