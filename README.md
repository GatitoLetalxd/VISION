# 🚗👁️ VISION - Sistema de Detección de Somnolencia

<div align="center">

![VISION Logo](https://img.shields.io/badge/VISION-Sistema%20de%20Detecci%C3%B3n-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

**Sistema inteligente de detección de somnolencia en conductores en tiempo real utilizando visión por computadora y aprendizaje profundo.**

[Características](#-características) •
[Demo](#-demo) •
[Instalación](#-instalación) •
[Documentación](#-documentación) •
[Tecnologías](#-tecnologías-utilizadas) •
[Autor](#-autor)

</div>

---

## 📋 Índice

- [Descripción](#-descripción)
- [Características](#-características)
- [Demo](#-demo)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías-utilizadas)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Documentación](#-documentación)
- [Algoritmos](#-algoritmos-implementados)
- [Seguridad](#-seguridad-y-privacidad)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)
- [Autor](#-autor)

---

## 🎯 Descripción

**VISION** es un sistema web avanzado de detección de somnolencia en tiempo real diseñado para prevenir accidentes de tránsito causados por fatiga del conductor. Utiliza tecnologías de visión por computadora y aprendizaje profundo para analizar el estado de alerta del conductor mediante la cámara del dispositivo.

### 💡 Problema que Resuelve

- **~20%** de los accidentes de tránsito son causados por somnolencia
- **1.25 millones** de personas mueren anualmente en accidentes de tránsito (OMS)
- La somnolencia reduce el tiempo de reacción hasta en **50%**

### ✨ Solución

Sistema de monitoreo **no invasivo** que detecta signos de somnolencia mediante:
- 👁️ Análisis del parpadeo y cierre de ojos
- 😴 Detección de bostezos
- 📊 Monitoreo de métricas faciales en tiempo real
- 🔔 Alertas sonoras ante situaciones críticas

---

## 🌟 Características

### Detección en Tiempo Real
- ✨ **Procesamiento en vivo**: 10 FPS con latencia < 100ms
- 👁️ **Eye Aspect Ratio (EAR)**: Algoritmo científico validado para detección de ojos cerrados
- 😴 **Mouth Aspect Ratio (MAR)**: Detección precisa de bostezos
- 🎯 **Detección facial robusta**: TinyFaceDetector optimizado para tiempo real
- 📍 **68 Facial Landmarks**: Tracking preciso de puntos faciales clave

### Interfaz Intuitiva
- 📊 **Métricas en tiempo real**: Visualización de EAR, MAR, nivel de somnolencia
- 🎨 **Overlay visual**: Indicadores en video con bounding box y landmarks
- 📈 **Estadísticas de sesión**: Contadores de eventos y alertas
- 🔔 **Alertas sonoras**: Tono crítico para eventos de alta prioridad
- 🌙 **Tema oscuro**: Interfaz moderna con Material-UI

### Sistema de Gestión
- 👥 **RBAC (Control de Acceso Basado en Roles)**:
  - **Admin**: Gestión completa del sistema y usuarios
  - **Operador**: Monitoreo y gestión de conductores
  - **Viewer**: Visualización de datos
- 📋 **Gestión de conductores**: CRUD completo con perfil detallado
- 🚗 **Gestión de vehículos**: Asociación conductor-vehículo
- 📊 **Dashboard analítico**: Estadísticas y gráficos en tiempo real
- 🔐 **Autenticación JWT**: Seguridad de sesiones

### Privacidad y Seguridad
- 🔒 **Procesamiento local**: face-api.js ejecuta 100% en navegador
- 🚫 **No almacenamiento de video**: Solo se transmiten métricas numéricas
- ✅ **GDPR Compliant**: Privacy by Design
- 🔐 **Encriptación**: HTTPS/WSS en producción
- 🛡️ **Rate Limiting**: Protección contra ataques

---

## 🎬 Demo

### Interfaz de Detección en Tiempo Real

```
┌─────────────────────────────────────────────────────────┐
│  📹 Video Feed                     📊 Métricas en Vivo  │
│                                                          │
│  ┌──────────────────────────┐     EAR:    0.28 ✓      │
│  │                          │     MAR:    0.42 ✓      │
│  │   👤 [Face Detection]    │     Nivel:  Normal       │
│  │      ● ● ● ● ●          │     FPS:    10           │
│  │    ●   ●   ●   ●        │                          │
│  │      ●   👄   ●          │     Umbral EAR: < 0.29   │
│  │    ●   ●   ●   ●        │     Umbral MAR: > 0.45   │
│  │      ● ● ● ● ●          │                          │
│  │                          │     ⚠️  Alertas: 2       │
│  └──────────────────────────┘     😴 Bostezos: 1      │
│                                   👁️  Ojos cerrados: 3  │
│  ▶️  Iniciar  ⏹️  Detener                              │
└─────────────────────────────────────────────────────────┘
```

### Estados de Detección

| Estado | EAR | MAR | Indicador | Alerta |
|--------|-----|-----|-----------|--------|
| **Normal** | > 0.29 | < 0.45 | 🟢 Verde | No |
| **Ojos cerrados** | < 0.29 | < 0.45 | 🟡 Amarillo | Sí (>1s) |
| **Bostezo** | > 0.29 | > 0.45 | 🟠 Naranja | Sí (>1.5s) |
| **Crítico** | < 0.29 | > 0.45 | 🔴 Rojo | ¡Sí! (sonido) |

---

## 🏗️ Arquitectura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTACIÓN (Cliente)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  React 18 + TypeScript + Vite                              │
│  ├── Components (Material-UI)                              │
│  ├── Services (Axios, Socket.IO Client)                    │
│  ├── face-api.js (TensorFlow.js)                           │
│  │   ├── TinyFaceDetector (Detección de rostros)          │
│  │   ├── FaceLandmark68Net (68 puntos faciales)           │
│  │   └── FaceRecognitionNet (Embeddings 128D)             │
│  └── Custom Algorithms (EAR, MAR, Drowsiness Logic)       │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS/WSS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    APLICACIÓN (Servidor)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Node.js + Express.js                                       │
│  ├── Authentication (JWT + bcrypt)                         │
│  ├── Authorization (RBAC Middleware)                       │
│  ├── REST API (Drivers, Vehicles, Users, Alerts)          │
│  ├── Socket.IO (Real-time events)                          │
│  ├── Security (Helmet, CORS, Rate Limiting)                │
│  └── File Uploads (Multer - Profile Photos)                │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ MySQL Protocol
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                       DATOS (Base de Datos)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MySQL 8.0                                                  │
│  ├── users (Usuarios y roles)                              │
│  ├── drivers (Conductores)                                 │
│  ├── vehicles (Vehículos)                                  │
│  ├── alerts (Alertas de somnolencia)                       │
│  └── events (Eventos del sistema)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Detección

```
Camera → Video Stream → face-api.js → TinyFaceDetector
                                            ↓
                                     Rostro detectado?
                                            ↓ Sí
                                   FaceLandmark68Net
                                            ↓
                                   68 puntos faciales
                                            ↓
                            ┌───────────────┴───────────────┐
                            ↓                               ↓
                      Puntos ojos                    Puntos boca
                      (36-47)                         (48-67)
                            ↓                               ↓
                   Algoritmo EAR                   Algoritmo MAR
                            ↓                               ↓
                      EAR < 0.29?                    MAR > 0.45?
                            ↓                               ↓
                   Ojos cerrados                       Bostezo
                            ↓                               ↓
                            └───────────────┬───────────────┘
                                            ↓
                                   Lógica de Somnolencia
                                            ↓
                            ┌───────────────┼───────────────┐
                            ↓               ↓               ↓
                       Actualizar UI    Socket.IO      Alerta sonora
                       (métricas)       (evento)        (si crítico)
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React** 18.2.0 - Librería UI
- **TypeScript** 5.2.2 - Tipado estático
- **Vite** 5.2.0 - Build tool ultra-rápido
- **Material-UI** 5.15.10 - Componentes UI
- **face-api.js** 0.22.2 - Detección facial
- **TensorFlow.js** 4.22.0 - ML en navegador
- **Socket.IO Client** 4.8.1 - WebSockets
- **Axios** 1.6.7 - HTTP client
- **Framer Motion** 11.0.5 - Animaciones

### Backend
- **Node.js** 20.x - Runtime
- **Express.js** 4.18.2 - Framework web
- **MySQL2** 3.9.1 - Cliente MySQL
- **Socket.IO** 4.7.4 - WebSockets server
- **JWT** (jsonwebtoken 9.0.2) - Autenticación
- **bcrypt** 5.1.1 - Hash de contraseñas
- **Helmet** 7.1.0 - Headers de seguridad
- **CORS** - Cross-Origin Resource Sharing
- **Multer** 1.4.5-lts.1 - Upload de archivos
- **express-rate-limit** - Rate limiting

### Base de Datos
- **MySQL** 8.0 - RDBMS

### DevOps
- **PM2** - Process manager
- **Vite** - Hot Module Replacement
- **ESLint** - Linting
- **Git** - Control de versiones

### Modelos de IA
- **TinyFaceDetector** (MobileNet-based)
- **FaceLandmark68Net** (iBUG 300-W)
- **FaceRecognitionNet** (ResNet-34)

---

## 📥 Instalación

### Prerrequisitos

```bash
- Node.js 20.x o superior
- MySQL 8.0 o superior
- npm o yarn
- Git
```

### 1. Clonar el repositorio

```bash
git clone git@github.com:TU-USUARIO/VISION.git
cd VISION
```

### 2. Configurar Base de Datos

```sql
-- Crear base de datos
CREATE DATABASE vision_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar base de datos
USE vision_db;

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
DB_NAME=vision_db
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
# Iniciar backend
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

### 5. Acceder a la aplicación

```
Frontend: https://localhost:5173
Backend API: https://localhost:5005
```

---

## 🎯 Uso

### 1. Crear Usuario Admin (Primera vez)

```sql
-- Conectar a MySQL
USE vision_db;

-- Crear usuario admin
INSERT INTO users (nombre, apellido, email, password, rol)
VALUES (
  'Admin',
  'Sistema',
  'admin@vision.com',
  '$2b$10$...',  -- Hash de 'admin123' con bcrypt
  'admin'
);
```

### 2. Login

- Ir a: `https://localhost:5173`
- Email: `admin@vision.com`
- Password: `admin123`

### 3. Gestionar Usuarios

- Dashboard → **Gestión de Usuarios** (solo admin)
- Crear operadores y viewers
- Cambiar roles y estados

### 4. Iniciar Detección de Somnolencia

- Dashboard → **Detección de Somnolencia**
- Click en **Iniciar Detección**
- Permitir acceso a cámara
- El sistema comenzará a monitorear

### 5. Ver Estadísticas

- Dashboard → **Estadísticas**
- Ver alertas, conductores, eventos en tiempo real

---

## 📚 Documentación

El proyecto incluye documentación técnica completa:

### 📖 Documentos Disponibles

- **[ARQUITECTURA.md](ARQUITECTURA.md)** - Arquitectura completa del sistema (738 líneas)
- **[MODELOS_IA.md](MODELOS_IA.md)** - Explicación detallada de modelos ML (1,155 líneas)
- **[REFERENCIAS_BIBLIOGRAFICAS.md](REFERENCIAS_BIBLIOGRAFICAS.md)** - 24 referencias académicas (913 líneas)
- **[DIAGRAMA_SIMPLE.md](DIAGRAMA_SIMPLE.md)** - Diagramas visuales simplificados (424 líneas)
- **[INSTRUCCIONES_GIT.md](INSTRUCCIONES_GIT.md)** - Guía completa de Git y GitHub

### 📊 Estadísticas de Documentación

- **Total**: 176 KB de documentación
- **Líneas**: 3,230 líneas
- **Referencias**: 24 papers y estudios citados
- **Formato**: APA 7ª + IEEE

---

## 🧠 Algoritmos Implementados

### Eye Aspect Ratio (EAR)

Basado en el paper de **Soukupová & Čech (2016)**.

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

```javascript
if (EAR < 0.29 durante 1s) → Ojos cerrados ⚠️
if (MAR > 0.45 durante 1.5s) → Bostezo 😴
if (Ojos cerrados y Bostezo) → CRÍTICO 🚨 + Alerta sonora
```

---

## 🔒 Seguridad y Privacidad

### Privacy by Design

✅ **Procesamiento local**: face-api.js ejecuta 100% en el navegador
✅ **No almacenamiento de video**: Solo métricas numéricas (EAR, MAR)
✅ **GDPR Compliant**: Art. 9, 25, 32
✅ **Consentimiento explícito**: Usuario autoriza cámara
✅ **Minimización de datos**: Solo datos esenciales

### Seguridad del Backend

✅ **JWT**: Tokens seguros con expiración
✅ **bcrypt**: Hash de contraseñas (10 rounds)
✅ **Helmet**: Headers de seguridad HTTP
✅ **CORS**: Orígenes permitidos configurables
✅ **Rate Limiting**: 500 req/15min
✅ **HTTPS/WSS**: Encriptación en producción
✅ **SQL Prepared Statements**: Prevención de SQL Injection
✅ **RBAC**: Control de acceso basado en roles

---

## 🗺️ Roadmap

### v1.1.0 (Próximo)
- [ ] Liveness detection (anti-spoofing)
- [ ] Exportación de reportes PDF
- [ ] Gráficos de tendencias históricas
- [ ] Notificaciones push

### v1.2.0
- [ ] Soporte multi-idioma (i18n)
- [ ] App móvil (React Native)
- [ ] Integración con hardware IoT
- [ ] ML mejorado con TensorFlow Lite

### v2.0.0
- [ ] Detección de distracción (mirar al celular)
- [ ] Análisis de emociones
- [ ] Sistema de recompensas para conductores seguros
- [ ] Dashboard analítico avanzado

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

### Cómo Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m '✨ feat: Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones de Commits

```
✨ feat:      Nueva funcionalidad
🐛 fix:       Corrección de bug
📚 docs:      Documentación
💄 style:     Formato, estilo
♻️  refactor:  Refactorización
⚡ perf:      Mejora de rendimiento
✅ test:      Tests
🔧 chore:     Mantenimiento
```

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**.

```
MIT License

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
```

---

## 👨‍💻 Autor

<div align="center">

**Rogeero Daniel Montufar Merma**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/TU-USUARIO)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/TU-PERFIL)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:tu_email@ejemplo.com)

</div>

---

## 🙏 Agradecimientos

- **Soukupová & Čech** por el algoritmo EAR
- **Vincent Mühler** por face-api.js
- **Google** por TensorFlow.js
- **Meta** por React
- **Comunidad Open Source**

---

## 📊 Estadísticas del Proyecto

```
Líneas de código:     ~15,000+
Archivos:             ~120+
Commits:              100+
Documentación:        176 KB
Referencias:          24 papers
Tecnologías:          15+
```

---

## 🔗 Enlaces Útiles

- **Documentación face-api.js**: https://github.com/justadudewhohacks/face-api.js
- **TensorFlow.js**: https://www.tensorflow.org/js
- **React**: https://react.dev/
- **Material-UI**: https://mui.com/
- **Paper EAR**: http://vision.fe.uni-lj.si/cvww2016/proceedings/papers/05.pdf

---

<div align="center">

**Hecho con ❤️ para salvar vidas en las carreteras**

⭐ **¡Dale una estrella si te gustó el proyecto!** ⭐

</div>

