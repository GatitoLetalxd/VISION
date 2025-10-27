# 🏗️ ARQUITECTURA DEL SISTEMA - VISION
## Sistema de Detección de Somnolencia en Conductores

---

## 📐 DIAGRAMA DE ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         🌐 CAPA DE PRESENTACIÓN                              │
│                         (Cliente Web - Navegador)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                     📱 FRONTEND (React + Vite)                      │    │
│  │                        Puerto: 5175 (HTTPS)                         │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  🎨 UI Components (Material-UI)                                    │    │
│  │  ├─ Dashboard.tsx         → Vista principal con estadísticas       │    │
│  │  ├─ DrowsinessDetection   → Detección en tiempo real              │    │
│  │  ├─ UserManagement        → Gestión de usuarios (Admin)           │    │
│  │  ├─ Login/Register        → Autenticación                         │    │
│  │  └─ Profile               → Gestión de perfil                     │    │
│  │                                                                     │    │
│  │  🧠 Services & Logic                                               │    │
│  │  ├─ api.ts                → Cliente HTTP (Axios)                  │    │
│  │  ├─ socket.service.ts     → Cliente WebSocket (Socket.IO)         │    │
│  │  ├─ drowsinessDetection   → Servicio de detección IA              │    │
│  │  └─ authService.ts        → Gestión de autenticación              │    │
│  │                                                                     │    │
│  │  🤖 AI/ML Layer                                                    │    │
│  │  ├─ face-api.js           → Detección facial                      │    │
│  │  ├─ TensorFlow.js         → Framework ML en navegador             │    │
│  │  ├─ TinyFaceDetector      → Modelo de detección rápida            │    │
│  │  ├─ FaceLandmark68Net     → 68 puntos faciales                    │    │
│  │  └─ Algoritmos Custom     → EAR (ojos) + MAR (boca)               │    │
│  │                                                                     │    │
│  │  📹 Media Access                                                   │    │
│  │  └─ Navigator.mediaDevices → Acceso a cámara web                  │    │
│  │                                                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    │ HTTPS/WSS                               │
│                                    ↓                                         │
└─────────────────────────────────────────────────────────────────────────────┘

                                     │
                        ┌────────────┴────────────┐
                        │   🔒 CERTIFICADOS SSL    │
                        │   .cert/key.pem          │
                        │   .cert/cert.pem         │
                        └────────────┬────────────┘
                                     │
                                     ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                          ⚙️ CAPA DE APLICACIÓN                               │
│                          (Servidor Backend - Node.js)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                   🚀 BACKEND (Express.js + Socket.IO)               │    │
│  │                        Puerto: 5005 (HTTPS)                         │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  🛡️ Security Layer                                                 │    │
│  │  ├─ Helmet.js             → Headers de seguridad                  │    │
│  │  ├─ CORS                  → Control de acceso                     │    │
│  │  ├─ Rate Limiting         → Protección contra ataques             │    │
│  │  ├─ Compression           → Compresión de respuestas              │    │
│  │  └─ JWT Authentication    → Tokens de sesión                      │    │
│  │                                                                     │    │
│  │  🔌 API REST Endpoints                                             │    │
│  │  ├─ /api/auth/*           → Autenticación (login/register)        │    │
│  │  ├─ /api/user/*           → Gestión de usuarios                   │    │
│  │  ├─ /api/drivers/*        → Gestión de conductores                │    │
│  │  ├─ /api/alerts/*         → Sistema de alertas                    │    │
│  │  ├─ /api/events/*         → Eventos de somnolencia                │    │
│  │  └─ /api/sessions/*       → Sesiones de monitoreo                 │    │
│  │                                                                     │    │
│  │  🌐 WebSocket Server (Socket.IO)                                   │    │
│  │  ├─ drowsiness_event      → Eventos en tiempo real                │    │
│  │  ├─ alert_notification    → Notificaciones push                   │    │
│  │  └─ session_update        → Actualizaciones de sesión             │    │
│  │                                                                     │    │
│  │  🎯 Controllers                                                    │    │
│  │  ├─ authController.js     → Lógica de autenticación               │    │
│  │  ├─ userController.js     → CRUD de usuarios + roles              │    │
│  │  ├─ driverController.js   → Gestión de conductores                │    │
│  │  ├─ alertController.js    → Alertas de somnolencia                │    │
│  │  └─ sessionController.js  → Sesiones de monitoreo                 │    │
│  │                                                                     │    │
│  │  🛠️ Middlewares                                                    │    │
│  │  ├─ authenticateToken.js  → Verificación JWT                      │    │
│  │  ├─ authorize.js          → Control de roles (RBAC)               │    │
│  │  ├─ errorHandler.js       → Manejo de errores                     │    │
│  │  └─ uploadMiddleware.js   → Procesamiento de archivos             │    │
│  │                                                                     │    │
│  │  📦 File Management                                                │    │
│  │  ├─ Multer                → Subida de archivos                    │    │
│  │  ├─ Sharp                 → Procesamiento de imágenes             │    │
│  │  └─ /uploads/*            → Almacenamiento estático               │    │
│  │                                                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    │ MySQL Protocol                          │
│                                    ↓                                         │
└─────────────────────────────────────────────────────────────────────────────┘

                                     │
                                     ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                           💾 CAPA DE DATOS                                   │
│                         (Base de Datos MySQL)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    🗄️ MySQL Database (mysql2)                       │    │
│  │                   Base de datos: sistema_alerta                     │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  📋 Tablas Principales                                             │    │
│  │                                                                     │    │
│  │  👥 users                                                          │    │
│  │  ├─ id, email, password (bcrypt)                                  │    │
│  │  ├─ first_name, last_name                                         │    │
│  │  ├─ role (admin, operator, viewer)                                │    │
│  │  ├─ profile_photo, is_active                                      │    │
│  │  └─ created_at, updated_at, deleted_at                            │    │
│  │                                                                     │    │
│  │  🚗 drivers                                                        │    │
│  │  ├─ id_conductor, nombre, apellido                                │    │
│  │  ├─ licencia, telefono, email                                     │    │
│  │  ├─ estado (activo/inactivo)                                      │    │
│  │  └─ foto_perfil, fecha_registro                                   │    │
│  │                                                                     │    │
│  │  📊 monitoring_sessions                                            │    │
│  │  ├─ id_sesion, id_conductor                                       │    │
│  │  ├─ fecha_inicio, fecha_fin                                       │    │
│  │  ├─ duracion_segundos, distancia_km                               │    │
│  │  └─ alertas_generadas, nivel_riesgo_promedio                      │    │
│  │                                                                     │    │
│  │  ⚠️ drowsiness_events                                              │    │
│  │  ├─ id_evento, id_sesion, id_conductor                            │    │
│  │  ├─ tipo_evento (eyes_closed, yawn, drowsiness)                   │    │
│  │  ├─ nivel_severidad (low, medium, high, critical)                 │    │
│  │  ├─ confianza, timestamp                                          │    │
│  │  └─ datos_adicionales (JSON: EAR, MAR, duration)                  │    │
│  │                                                                     │    │
│  │  🔔 alerts                                                         │    │
│  │  ├─ id_alerta, id_evento, id_conductor                            │    │
│  │  ├─ tipo_alerta, nivel_severidad                                  │    │
│  │  ├─ mensaje, accion_tomada                                        │    │
│  │  └─ timestamp, resuelto                                           │    │
│  │                                                                     │    │
│  │  🔗 Relaciones                                                     │    │
│  │  users ─┐                                                          │    │
│  │         ├─→ drivers (gestión)                                      │    │
│  │         └─→ monitoring_sessions (acceso según rol)                │    │
│  │                                                                     │    │
│  │  drivers ─→ monitoring_sessions ─→ drowsiness_events ─→ alerts    │    │
│  │                                                                     │    │
│  │  📈 Índices para Performance                                       │    │
│  │  ├─ idx_email (users)                                             │    │
│  │  ├─ idx_role (users)                                              │    │
│  │  ├─ idx_driver_session (monitoring_sessions)                      │    │
│  │  ├─ idx_event_timestamp (drowsiness_events)                       │    │
│  │  └─ idx_alert_severity (alerts)                                   │    │
│  │                                                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUJO DE COMUNICACIÓN DETALLADO

### 1️⃣ **AUTENTICACIÓN Y AUTORIZACIÓN**

```
┌─────────────┐      HTTPS POST /api/auth/login      ┌──────────────┐
│   Cliente   │ ────────────────────────────────────> │   Backend    │
│  (Browser)  │  { email, contraseña }               │  (Express)   │
└─────────────┘                                       └──────────────┘
                                                             │
                                                             ↓
                                                      ┌──────────────┐
                                                      │    MySQL     │
                                                      │  users tabla │
                                                      └──────────────┘
                                                             │
                                                             ↓ bcrypt.compare
                                                      ┌──────────────┐
                                                      │ JWT Generate │
                                                      │  jwt.sign()  │
                                                      └──────────────┘
                                                             │
┌─────────────┐      { token, user }                       │
│   Cliente   │ <───────────────────────────────────────────┘
│  localStorage│  Almacena token para futuras requests
└─────────────┘

┌─────────────┐      HTTPS GET /api/user/profile     ┌──────────────┐
│   Cliente   │ ────────────────────────────────────> │   Backend    │
│  (Browser)  │  Header: Authorization: Bearer <JWT> │  Middleware  │
└─────────────┘                                       └──────────────┘
                                                             │
                                                             ↓ authenticateToken
                                                      ┌──────────────┐
                                                      │ JWT Verify   │
                                                      │ + authorize  │
                                                      │  (RBAC)      │
                                                      └──────────────┘
                                                             │
                                                             ↓ Si válido
                                                      ┌──────────────┐
                                                      │  Controller  │
                                                      │   ejecuta    │
                                                      └──────────────┘
```

---

### 2️⃣ **DETECCIÓN DE SOMNOLENCIA EN TIEMPO REAL**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. 📹 Acceso a Cámara                                              │
│     navigator.mediaDevices.getUserMedia({ video: true })          │
│                          │                                          │
│                          ↓                                          │
│  2. 🎥 Stream de Video                                              │
│     <video> element recibe stream en tiempo real                   │
│                          │                                          │
│                          ↓                                          │
│  3. 🧠 Procesamiento IA (face-api.js)                               │
│     ┌──────────────────────────────────────────────────┐           │
│     │ Cada 100ms (10 FPS):                             │           │
│     │                                                   │           │
│     │ a) TinyFaceDetector                              │           │
│     │    └─> Detecta rostro en frame                   │           │
│     │                                                   │           │
│     │ b) FaceLandmark68Net                             │           │
│     │    └─> Identifica 68 puntos faciales             │           │
│     │        • Ojos (landmarks 36-47)                  │           │
│     │        • Boca (landmarks 48-67)                  │           │
│     │                                                   │           │
│     │ c) Cálculos Custom                               │           │
│     │    ├─> EAR (Eye Aspect Ratio)                    │           │
│     │    │   Formula: (|p2-p6| + |p3-p5|) / (2*|p1-p4|)│           │
│     │    │   Umbral: < 0.29 = ojos cerrados            │           │
│     │    │                                              │           │
│     │    └─> MAR (Mouth Aspect Ratio)                  │           │
│     │        Formula: (|p14-p20| + ...) / (2*|p13-p17|)│           │
│     │        Umbral: > 0.45 = bostezo                  │           │
│     │                                                   │           │
│     │ d) Determinación de Nivel                        │           │
│     │    ├─> none:     Normal                          │           │
│     │    ├─> low:      Ojos cerrados                   │           │
│     │    ├─> medium:   Bostezo                         │           │
│     │    ├─> high:     Ojos cerrados prolongado        │           │
│     │    └─> critical: Ojos cerrados + Bostezo         │           │
│     └──────────────────────────────────────────────────┘           │
│                          │                                          │
│                          ↓                                          │
│  4. 🎨 Visualización                                                │
│     <canvas> overlay sobre video                                   │
│     ├─> Cuadro facial (color según nivel)                          │
│     ├─> Landmarks (puntos faciales)                                │
│     └─> Métricas en tiempo real                                    │
│                          │                                          │
│                          ↓                                          │
│  5. ⏱️ Sistema de Conteo Temporal                                   │
│     ┌──────────────────────────────────────────────────┐           │
│     │ Ojos cerrados × 1.0s (10 frames)                 │           │
│     │   → Registra +1 eyesClosedCount                  │           │
│     │                                                   │           │
│     │ Bostezo × 1.5s (15 frames)                       │           │
│     │   → Registra +1 yawnCount                        │           │
│     │                                                   │           │
│     │ Somnolencia crítica × 1.5s (15 frames)           │           │
│     │   → Registra +1 drowsinessCount                  │           │
│     │   → 🔊 Reproduce alerta sonora                   │           │
│     └──────────────────────────────────────────────────┘           │
│                          │                                          │
│                          ↓                                          │
│  6. 📡 Emisión de Eventos (Socket.IO)                               │
│     socketService.emit('drowsiness_event', {                       │
│       tipo_evento: 'eyes_closed' | 'yawn' | 'drowsiness',         │
│       nivel_severidad: 'low' | 'medium' | 'high' | 'critical',    │
│       ear, mar, timestamp, duration                                │
│     })                                                             │
│                          │                                          │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
                           │ WebSocket (WSS)
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVIDOR (Backend)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  7. 🌐 Socket.IO Server recibe evento                               │
│     socket.on('drowsiness_event', async (data) => {                │
│       // Validar datos                                             │
│       // Guardar en base de datos                                  │
│       // Generar alerta si es necesario                            │
│       // Broadcast a otros clientes conectados                     │
│     })                                                             │
│                          │                                          │
│                          ↓                                          │
│  8. 💾 Persistencia en MySQL                                        │
│     INSERT INTO drowsiness_events (...)                            │
│     INSERT INTO alerts (...)                                       │
│     UPDATE monitoring_sessions (...)                               │
│                          │                                          │
│                          ↓                                          │
│  9. 📢 Notificación en Tiempo Real                                  │
│     io.emit('alert_notification', alertData)                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3️⃣ **GESTIÓN DE USUARIOS Y ROLES (RBAC)**

```
┌──────────────────────────────────────────────────────────────┐
│                    SISTEMA DE ROLES                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  👑 ADMIN                                                    │
│  ├─> Gestión completa de usuarios                           │
│  ├─> Cambiar roles de usuarios                              │
│  ├─> Activar/Desactivar usuarios                            │
│  ├─> Eliminar usuarios (soft delete)                        │
│  ├─> Ver todas las estadísticas                             │
│  ├─> Gestión de conductores (CRUD completo)                 │
│  └─> Acceso a todos los endpoints                           │
│                                                              │
│  👨‍💼 OPERATOR                                                 │
│  ├─> Ver conductores                                         │
│  ├─> Ver sesiones de monitoreo                              │
│  ├─> Ver alertas                                            │
│  ├─> Generar reportes                                       │
│  └─> NO puede modificar usuarios                            │
│                                                              │
│  👀 VIEWER                                                   │
│  ├─> Solo lectura de dashboard                              │
│  ├─> Ver estadísticas generales                             │
│  ├─> Ver su propio perfil                                   │
│  └─> Sin permisos de escritura                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Flujo de Autorización:

Request → authenticateToken → authorize(roles) → Controller
             (JWT válido?)      (rol permitido?)     (ejecuta)
                  │                   │                  │
                  ↓                   ↓                  ↓
              ✅ Válido           ✅ Autorizado      ✅ Success
              ❌ 401              ❌ 403             ❌ Error
```

---

## 🛠️ STACK TECNOLÓGICO COMPLETO

### **FRONTEND**

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18.2.0 | Framework UI principal |
| **TypeScript** | 5.3.3 | Tipado estático |
| **Vite** | 5.1.3 | Build tool & dev server |
| **Material-UI** | 5.15.10 | Biblioteca de componentes |
| **Framer Motion** | 11.0.5 | Animaciones fluidas |
| **React Router** | 6.22.1 | Navegación SPA |
| **Axios** | 1.6.7 | Cliente HTTP |
| **Socket.IO Client** | 4.8.1 | WebSocket cliente |
| **Formik** | 2.4.5 | Manejo de formularios |
| **Yup** | 1.3.3 | Validación de esquemas |
| **face-api.js** | 0.22.2 | Detección facial IA |
| **TensorFlow.js** | 4.22.0 | ML en navegador |

### **BACKEND**

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 18+ | Runtime JavaScript |
| **Express.js** | 4.21.2 | Framework web |
| **Socket.IO** | 4.7.4 | WebSocket servidor |
| **MySQL2** | 3.14.1 | Driver de base de datos |
| **JWT** | 9.0.2 | Autenticación por tokens |
| **bcrypt** | 5.1.1 | Hash de contraseñas |
| **Helmet** | 7.1.0 | Seguridad HTTP headers |
| **CORS** | 2.8.5 | Control de acceso |
| **Rate Limit** | 7.1.5 | Protección DDoS |
| **Compression** | 1.7.4 | Compresión gzip |
| **Multer** | 1.4.5 | Upload de archivos |
| **Sharp** | 0.34.2 | Procesamiento de imágenes |
| **Morgan** | 1.10.0 | Logger HTTP |
| **Winston** | 3.11.0 | Logger avanzado |
| **Joi** | 17.11.0 | Validación de datos |

### **BASE DE DATOS**

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **MySQL** | 8.0+ | Base de datos relacional |
| **InnoDB** | - | Motor de almacenamiento |

### **INFRAESTRUCTURA**

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **PM2** | Latest | Process manager |
| **OpenSSL** | - | Certificados SSL |
| **Git** | - | Control de versiones |

### **ALGORITMOS CUSTOM**

| Algoritmo | Fórmula | Umbral |
|-----------|---------|--------|
| **EAR** (Eye Aspect Ratio) | `(‖p2-p6‖ + ‖p3-p5‖) / (2 × ‖p1-p4‖)` | < 0.29 |
| **MAR** (Mouth Aspect Ratio) | `(‖p14-p20‖ + ‖p15-p19‖ + ‖p16-p18‖) / (2 × ‖p13-p17‖)` | > 0.45 |

---

## 🔒 SEGURIDAD

```
┌────────────────────────────────────────────────────────────┐
│                   CAPAS DE SEGURIDAD                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. 🔐 Transporte Seguro                                   │
│     • HTTPS/TLS para frontend                             │
│     • HTTPS/TLS para backend                              │
│     • WSS (WebSocket Secure)                              │
│     • Certificados SSL (self-signed para dev)             │
│                                                            │
│  2. 🛡️ Headers de Seguridad (Helmet)                      │
│     • X-Frame-Options: DENY                               │
│     • X-Content-Type-Options: nosniff                     │
│     • Strict-Transport-Security                           │
│     • Content-Security-Policy                             │
│                                                            │
│  3. 🔑 Autenticación                                       │
│     • JWT con expiración de 24h                           │
│     • Contraseñas hasheadas con bcrypt (rounds: 10)       │
│     • Tokens almacenados en localStorage                  │
│                                                            │
│  4. 👥 Autorización (RBAC)                                 │
│     • Middleware de roles                                 │
│     • Control granular por endpoint                       │
│     • Verificación en cada request                        │
│                                                            │
│  5. 🚫 Protección contra Ataques                           │
│     • Rate Limiting (500 req/15min)                       │
│     • CORS configurado                                    │
│     • Validación de entrada (Joi)                         │
│     • SQL Injection (prepared statements)                 │
│     • XSS (sanitización de datos)                         │
│                                                            │
│  6. 📝 Logging y Auditoría                                 │
│     • Morgan para requests HTTP                           │
│     • Winston para logs avanzados                         │
│     • Timestamps en todos los eventos                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 FLUJO DE DATOS COMPLETO

```
┌─────────────┐
│   CÁMARA    │ Video Stream
└─────┬───────┘
      │
      ↓
┌──────────────────────┐
│  NAVEGADOR           │
│  • Captura frames    │ ─────┐
│  • Procesa con IA    │      │
│  • Calcula EAR/MAR   │      │
│  • Detecta eventos   │      │
└──────────────────────┘      │
      │                       │
      ↓                       │
┌──────────────────────┐      │ WebSocket
│  SOCKET.IO CLIENT    │      │ (Tiempo Real)
│  • Emite eventos     │ ─────┤
└──────────────────────┘      │
                              │
                              ↓
                    ┌──────────────────────┐
                    │  SOCKET.IO SERVER    │
                    │  • Recibe eventos    │
                    │  • Valida datos      │
                    └──────────┬───────────┘
                              │
                              ↓
                    ┌──────────────────────┐
                    │  EXPRESS BACKEND     │
                    │  • Controllers       │
                    │  • Business Logic    │
                    └──────────┬───────────┘
                              │
                              ↓
                    ┌──────────────────────┐
                    │  MYSQL DATABASE      │
                    │  • drowsiness_events │
                    │  • alerts            │
                    │  • sessions          │
                    └──────────────────────┘

Flujo inverso (Consultas):

Cliente → HTTP Request → Express → MySQL → Response → Cliente
Cliente → WebSocket   → Socket.IO → Broadcast → Todos los clientes
```

---

## 🚀 OPTIMIZACIONES DE PERFORMANCE

### **Frontend**
- ✅ Code splitting (vendor chunks)
- ✅ Lazy loading de componentes
- ✅ Throttling de detección (10 FPS en vez de 30-60)
- ✅ Reduced input size para face detection (224px)
- ✅ Canvas hardware acceleration
- ✅ Memoización de cálculos pesados

### **Backend**
- ✅ Connection pooling (20 conexiones)
- ✅ Compresión gzip de respuestas
- ✅ Caching de archivos estáticos (1 día)
- ✅ Índices en base de datos
- ✅ Rate limiting inteligente
- ✅ Prepared statements (MySQL2)

### **Base de Datos**
- ✅ Índices optimizados
- ✅ InnoDB engine
- ✅ Timezone UTC (sin conversiones)
- ✅ Keep-alive de conexiones
- ✅ Soft deletes (no eliminación física)

---

## 🔄 CICLO DE VIDA DE UNA SESIÓN

```
1. 👤 USUARIO INICIA SESIÓN
   └─> Login → JWT → localStorage

2. 📊 ACCEDE AL DASHBOARD
   └─> Carga estadísticas desde API REST

3. 🎥 ACTIVA DETECCIÓN
   └─> Solicita permiso de cámara
   └─> Carga modelos de IA
   └─> Inicia stream de video

4. 🧠 PROCESAMIENTO CONTINUO (10 FPS)
   └─> Frame → Face Detection → Landmarks → EAR/MAR → Nivel
   └─> Visualización en canvas
   └─> Contador de tiempo

5. ⚠️ EVENTO DETECTADO
   └─> Cliente: Incrementa estadísticas locales
   └─> Socket: Emite evento al servidor
   └─> Servidor: Guarda en MySQL
   └─> Servidor: Broadcast a otros usuarios

6. 🔔 ALERTA CRÍTICA
   └─> Reproduce sonido
   └─> Muestra notificación visual
   └─> Registra en alerts tabla

7. 🛑 DETIENE SESIÓN
   └─> Limpia stream de cámara
   └─> Resetea contadores
   └─> Guarda resumen de sesión

8. 📈 VISUALIZA ESTADÍSTICAS
   └─> Dashboard actualizado en tiempo real
   └─> Gráficos y métricas
```

---

## 📁 ESTRUCTURA DE DIRECTORIOS

```
/var/www/VISION/
│
├── 📁 frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/          # Páginas principales
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DrowsinessDetection.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── services/       # Servicios (API, Socket, IA)
│   │   │   ├── api.ts
│   │   │   ├── socket.service.ts
│   │   │   ├── drowsinessDetection.service.ts
│   │   │   └── authService.ts
│   │   ├── types/          # TypeScript types
│   │   ├── config/         # Configuración
│   │   └── router.tsx      # Rutas
│   ├── public/
│   │   └── models/         # Modelos face-api.js
│   ├── .cert/              # Certificados SSL
│   └── vite.config.ts      # Configuración Vite
│
├── 📁 backend/
│   ├── src/
│   │   ├── config/         # DB config
│   │   │   └── database.js
│   │   ├── controllers/    # Lógica de negocio
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── driverController.js
│   │   │   ├── alertController.js
│   │   │   └── sessionController.js
│   │   ├── middlewares/    # Middleware custom
│   │   │   ├── authenticateToken.js
│   │   │   ├── authorize.js
│   │   │   └── errorHandler.js
│   │   ├── routes/         # Rutas API
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── driverRoutes.js
│   │   │   ├── alertRoutes.js
│   │   │   └── sessionRoutes.js
│   │   └── server.js       # Punto de entrada
│   ├── database/           # Scripts SQL
│   │   └── schema.sql
│   ├── uploads/            # Archivos subidos
│   │   └── profile-photos/
│   └── .env                # Variables de entorno
│
├── ecosystem.config.cjs    # PM2 config
└── ARQUITECTURA.md         # Este archivo
```

---

## 🎯 ENDPOINTS API PRINCIPALES

### **Autenticación**
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cerrar sesión

### **Usuarios** (requiere autenticación)
- `GET /api/user/profile` - Obtener perfil
- `PUT /api/user/profile` - Actualizar perfil
- `POST /api/user/photo` - Subir foto de perfil
- `GET /api/user/all` - Listar usuarios (admin)
- `PUT /api/user/:id/role` - Cambiar rol (admin)
- `PUT /api/user/:id/status` - Activar/Desactivar (admin)
- `DELETE /api/user/:id` - Eliminar usuario (admin)

### **Conductores**
- `GET /api/drivers` - Listar conductores
- `GET /api/drivers/:id` - Obtener conductor
- `POST /api/drivers` - Crear conductor (admin)
- `PUT /api/drivers/:id` - Actualizar conductor (admin)
- `DELETE /api/drivers/:id` - Eliminar conductor (admin)
- `GET /api/drivers/:id/stats` - Estadísticas

### **Sesiones**
- `GET /api/sessions` - Listar sesiones
- `GET /api/sessions/:id` - Obtener sesión
- `POST /api/sessions` - Crear sesión
- `PUT /api/sessions/:id` - Actualizar sesión

### **Eventos**
- `GET /api/events` - Listar eventos
- `GET /api/events/:id` - Obtener evento
- `POST /api/events` - Crear evento

### **Alertas**
- `GET /api/alerts` - Listar alertas
- `GET /api/alerts/:id` - Obtener alerta
- `POST /api/alerts` - Crear alerta
- `PUT /api/alerts/:id/resolve` - Resolver alerta

---

## 🌐 EVENTOS WEBSOCKET

### **Cliente → Servidor**
- `drowsiness_event` - Evento de somnolencia detectado
- `session_start` - Iniciar sesión de monitoreo
- `session_end` - Finalizar sesión

### **Servidor → Cliente**
- `alert_notification` - Nueva alerta generada
- `session_update` - Actualización de sesión
- `user_status_change` - Cambio de estado de usuario

---

## 📝 CONCLUSIÓN

Este sistema implementa una arquitectura **moderna**, **escalable** y **segura** para la detección de somnolencia en conductores, combinando:

✅ **Machine Learning en el navegador** (face-api.js + TensorFlow.js)
✅ **Comunicación en tiempo real** (Socket.IO)
✅ **API REST robusta** (Express.js)
✅ **Sistema de roles** (RBAC)
✅ **Seguridad multicapa** (HTTPS, JWT, Helmet, Rate Limiting)
✅ **Optimización de performance** (Throttling, caching, connection pooling)
✅ **Escalabilidad** (PM2, MySQL connection pool)

---

**Generado:** $(date)
**Proyecto:** VISION - Sistema de Detección de Somnolencia
**Versión:** 1.0.0

