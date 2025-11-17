# 🔄 DIAGRAMAS DE FLUJO - SISTEMA VISION

## Comunicación entre Componentes y Usuario Final

---

## 📊 DIAGRAMA 1: Arquitectura General

```mermaid
graph TB
    subgraph "👤 USUARIO FINAL"
        U[Usuario/Conductor<br/>Navegador Web]
    end
    
    subgraph "🖥️ FRONTEND - React App"
        UI[Interfaz de Usuario<br/>Material-UI]
        FC[Face Detection Component<br/>DrowsinessDetection.tsx]
        API[API Service<br/>Axios]
        WS[WebSocket Client<br/>Socket.IO]
        FACE[face-api.js<br/>TensorFlow.js]
    end
    
    subgraph "⚙️ BACKEND - Node.js Server"
        SERVER[Express Server<br/>:5005]
        AUTH[Authentication<br/>JWT + bcrypt]
        RBAC[Authorization<br/>RBAC Middleware]
        REST[REST API<br/>Controllers]
        WSS[WebSocket Server<br/>Socket.IO]
        UPLOAD[File Upload<br/>Multer]
    end
    
    subgraph "💾 BASE DE DATOS"
        DB[(MySQL<br/>vision_db)]
    end
    
    subgraph "🤖 MODELOS IA"
        M1[TinyFaceDetector<br/>Face Detection]
        M2[FaceLandmark68Net<br/>68 Landmarks]
        M3[FaceRecognitionNet<br/>Face Embeddings]
    end
    
    U -->|HTTPS| UI
    UI --> FC
    UI --> API
    UI --> WS
    
    FC --> FACE
    FACE --> M1
    FACE --> M2
    FACE --> M3
    
    API -->|HTTPS/REST| SERVER
    WS -->|WSS| WSS
    
    SERVER --> AUTH
    SERVER --> RBAC
    SERVER --> REST
    SERVER --> UPLOAD
    
    REST -->|SQL| DB
    WSS -->|Eventos RT| WS
    
    M1 -.->|Procesamiento<br/>Local| FC
    M2 -.->|Procesamiento<br/>Local| FC
    M3 -.->|Procesamiento<br/>Local| FC
    
    style U fill:#4CAF50,stroke:#2E7D32,color:#fff
    style FACE fill:#FF6F00,stroke:#E65100,color:#fff
    style SERVER fill:#2196F3,stroke:#1565C0,color:#fff
    style DB fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

---

## 📊 DIAGRAMA 2: Flujo de Detección de Somnolencia

```mermaid
sequenceDiagram
    participant U as 👤 Usuario
    participant CAM as 📹 Cámara
    participant UI as 🖥️ UI React
    participant FACE as 🤖 face-api.js
    participant WS as 🔌 WebSocket
    participant BE as ⚙️ Backend
    participant DB as 💾 MySQL
    
    U->>UI: Click "Iniciar Detección"
    UI->>CAM: Solicitar permiso cámara
    CAM-->>UI: Stream de video
    
    loop Cada 100ms (10 FPS)
        UI->>FACE: Frame de video
        FACE->>FACE: TinyFaceDetector
        
        alt Rostro detectado
            FACE->>FACE: FaceLandmark68Net (68 puntos)
            FACE->>FACE: Calcular EAR (ojos)
            FACE->>FACE: Calcular MAR (boca)
            
            alt Ojos cerrados (EAR < 0.29)
                FACE-->>UI: ⚠️ Ojos cerrados
                UI->>UI: Incrementar contador
                UI->>UI: Actualizar métricas
                
                alt > 1 segundo
                    UI->>WS: Evento "eyes_closed"
                    WS->>BE: Socket event
                    BE->>DB: INSERT alert
                    BE-->>WS: Confirmación
                    WS-->>UI: Alert registrada
                    UI->>UI: 🔔 Alerta visual
                end
            end
            
            alt Bostezo (MAR > 0.45)
                FACE-->>UI: 😴 Bostezo detectado
                UI->>UI: Incrementar contador
                
                alt > 1.5 segundos
                    UI->>WS: Evento "yawning"
                    WS->>BE: Socket event
                    BE->>DB: INSERT alert
                    UI->>UI: 🔔 Alerta visual
                end
            end
            
            alt Somnolencia crítica
                FACE-->>UI: 🚨 CRÍTICO
                UI->>UI: 🔊 Reproducir sonido alerta
                UI->>WS: Evento "critical_drowsiness"
                WS->>BE: Socket event
                BE->>DB: INSERT alert (crítica)
                BE-->>WS: Notificar otros operadores
            end
            
        else Sin rostro
            FACE-->>UI: ❌ No detectado
            UI->>UI: Mostrar mensaje
        end
        
        FACE-->>UI: Dibujar bounding box + landmarks
    end
    
    U->>UI: Click "Detener"
    UI->>CAM: Detener stream
    UI->>WS: Evento "session_end"
    WS->>BE: Finalizar sesión
    BE->>DB: UPDATE session stats
```

---

## 📊 DIAGRAMA 3: Flujo de Autenticación

```mermaid
sequenceDiagram
    participant U as 👤 Usuario
    participant UI as 🖥️ Login UI
    participant API as 📡 API Service
    participant BE as ⚙️ Backend
    participant DB as 💾 MySQL
    
    U->>UI: Ingresar email + password
    UI->>API: POST /api/auth/login
    API->>BE: HTTP Request
    
    BE->>DB: SELECT user WHERE email
    DB-->>BE: User data (+ hashed password)
    
    alt Credenciales válidas
        BE->>BE: bcrypt.compare(password, hash)
        BE->>BE: Generar JWT token
        BE-->>API: 200 OK + { token, user, role }
        API-->>UI: Success response
        UI->>UI: Guardar token en localStorage
        UI->>UI: Guardar user data
        UI-->>U: Redirect a Dashboard
        
        UI->>API: GET /api/user/profile
        API->>BE: HTTP + Authorization: Bearer token
        BE->>BE: Verificar JWT
        BE->>DB: SELECT user profile
        DB-->>BE: Profile data + photo
        BE-->>API: 200 OK + profile
        API-->>UI: Profile loaded
        UI-->>U: Mostrar Dashboard personalizado
        
    else Credenciales inválidas
        BE-->>API: 401 Unauthorized
        API-->>UI: Error response
        UI-->>U: ❌ "Credenciales incorrectas"
    end
```

---

## 📊 DIAGRAMA 4: Flujo de Gestión de Usuarios (Admin)

```mermaid
graph LR
    subgraph "👤 ADMIN"
        A[Usuario Admin]
    end
    
    subgraph "🖥️ FRONTEND"
        UM[UserManagement.tsx]
        TABLE[Tabla de usuarios]
        DIALOG[Diálogos confirmación]
    end
    
    subgraph "⚙️ BACKEND API"
        AUTH[Verificar JWT]
        RBAC[Verificar rol = admin]
        CTRL[UserController]
    end
    
    subgraph "💾 DATABASE"
        USERS[(Tabla users)]
    end
    
    A -->|1. Accede a Gestión| UM
    UM -->|2. GET /api/users/all| AUTH
    AUTH -->|3. Token válido| RBAC
    RBAC -->|4. Es admin| CTRL
    CTRL -->|5. SELECT * FROM users| USERS
    USERS -->|6. Lista usuarios| CTRL
    CTRL -->|7. Response| UM
    UM -->|8. Renderizar| TABLE
    TABLE -->|9. Ver usuarios| A
    
    A -->|10. Cambiar rol| DIALOG
    DIALOG -->|11. PUT /api/users/:id/role| AUTH
    AUTH --> RBAC
    RBAC --> CTRL
    CTRL -->|12. UPDATE users SET rol| USERS
    USERS -->|13. Updated| CTRL
    CTRL -->|14. Success| UM
    UM -->|15. Actualizar UI| A
    
    style A fill:#4CAF50,stroke:#2E7D32,color:#fff
    style AUTH fill:#FF9800,stroke:#F57C00,color:#fff
    style RBAC fill:#F44336,stroke:#C62828,color:#fff
    style USERS fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

---

## 📊 DIAGRAMA 5: Comunicación en Tiempo Real (WebSocket)

```mermaid
graph TB
    subgraph "👥 CLIENTES"
        C1[Cliente 1<br/>Admin]
        C2[Cliente 2<br/>Operador]
        C3[Cliente 3<br/>Viewer]
    end
    
    subgraph "🔌 WEBSOCKET SERVER"
        WSS[Socket.IO Server<br/>:5005]
        ROOMS[Salas por rol]
        EMIT[Event Emitter]
    end
    
    subgraph "📊 EVENTOS"
        E1[alert_created]
        E2[driver_updated]
        E3[critical_drowsiness]
        E4[session_started]
        E5[session_ended]
    end
    
    subgraph "💾 PERSISTENCIA"
        DB[(MySQL)]
        CACHE[Cache en memoria]
    end
    
    C1 <-->|WSS| WSS
    C2 <-->|WSS| WSS
    C3 <-->|WSS| WSS
    
    WSS --> ROOMS
    ROOMS --> EMIT
    
    EMIT -.->|broadcast| E1
    EMIT -.->|broadcast| E2
    EMIT -.->|to admins/ops| E3
    EMIT -.->|broadcast| E4
    EMIT -.->|broadcast| E5
    
    E1 -->|guardar| DB
    E2 -->|actualizar| DB
    E3 -->|guardar crítico| DB
    
    E1 -.->|notificar| C1
    E1 -.->|notificar| C2
    E1 -.->|notificar| C3
    
    E3 -.->|alerta| C1
    E3 -.->|alerta| C2
    
    CACHE <--> WSS
    
    style WSS fill:#2196F3,stroke:#1565C0,color:#fff
    style E3 fill:#F44336,stroke:#C62828,color:#fff
    style DB fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

---

## 📊 DIAGRAMA 6: Stack Tecnológico Completo

```mermaid
graph TB
    subgraph "🌐 CAPA DE PRESENTACIÓN"
        BROWSER[Navegador Web<br/>Chrome/Firefox/Safari]
        HTML[HTML5 + CSS3]
        REACT[React 18.2.0]
        TS[TypeScript 5.2.2]
        MUI[Material-UI 5.15.10]
        VITE[Vite 5.2.0]
    end
    
    subgraph "🤖 CAPA DE IA"
        FACEAPI[face-api.js 0.22.2]
        TFJS[TensorFlow.js 4.22.0]
        WEBGL[WebGL Backend]
        M1[TinyFaceDetector]
        M2[FaceLandmark68Net]
        M3[FaceRecognitionNet]
    end
    
    subgraph "🔗 CAPA DE COMUNICACIÓN"
        AXIOS[Axios 1.6.7]
        SOCKETC[Socket.IO Client 4.8.1]
        HTTPS[HTTPS/TLS]
        WSS[WebSocket Secure]
    end
    
    subgraph "⚙️ CAPA DE APLICACIÓN"
        NODE[Node.js 20.x]
        EXPRESS[Express.js 4.18.2]
        SOCKETS[Socket.IO 4.7.4]
        JWT[JWT 9.0.2]
        BCRYPT[bcrypt 5.1.1]
        HELMET[Helmet 7.1.0]
        MULTER[Multer 1.4.5]
    end
    
    subgraph "💾 CAPA DE DATOS"
        MYSQL[MySQL 8.0]
        POOL[Connection Pool]
        TABLES[Tablas:<br/>users, drivers,<br/>vehicles, alerts,<br/>events]
    end
    
    subgraph "🔧 CAPA DE INFRAESTRUCTURA"
        PM2[PM2 Process Manager]
        SSL[Certificados SSL]
        UFW[Firewall UFW]
        LINUX[Linux Server]
    end
    
    BROWSER --> HTML
    HTML --> REACT
    REACT --> TS
    TS --> MUI
    MUI --> VITE
    
    REACT --> FACEAPI
    FACEAPI --> TFJS
    TFJS --> WEBGL
    TFJS --> M1
    TFJS --> M2
    TFJS --> M3
    
    REACT --> AXIOS
    REACT --> SOCKETC
    AXIOS --> HTTPS
    SOCKETC --> WSS
    
    HTTPS --> EXPRESS
    WSS --> SOCKETS
    
    EXPRESS --> NODE
    NODE --> JWT
    NODE --> BCRYPT
    NODE --> HELMET
    NODE --> MULTER
    NODE --> SOCKETS
    
    EXPRESS --> MYSQL
    MYSQL --> POOL
    POOL --> TABLES
    
    NODE --> PM2
    EXPRESS --> SSL
    LINUX --> UFW
    PM2 --> LINUX
    
    style BROWSER fill:#4CAF50,stroke:#2E7D32,color:#fff
    style FACEAPI fill:#FF6F00,stroke:#E65100,color:#fff
    style EXPRESS fill:#2196F3,stroke:#1565C0,color:#fff
    style MYSQL fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style PM2 fill:#00BCD4,stroke:#0097A7,color:#fff
```

---

## 📊 DIAGRAMA 7: Flujo de Datos EAR/MAR

```mermaid
flowchart TD
    START([Inicio: Frame de video]) --> DETECT{TinyFaceDetector<br/>¿Rostro detectado?}
    
    DETECT -->|No| NOFACE[Mostrar mensaje<br/>'No se detecta rostro']
    NOFACE --> END([Fin])
    
    DETECT -->|Sí| LANDMARKS[FaceLandmark68Net<br/>Extraer 68 puntos]
    
    LANDMARKS --> EYES[Extraer puntos ojos<br/>36-47]
    LANDMARKS --> MOUTH[Extraer puntos boca<br/>48-67]
    
    EYES --> CALCEYE[Calcular EAR<br/>EAR = vertical / horizontal]
    MOUTH --> CALCMOUTH[Calcular MAR<br/>MAR = vertical / horizontal]
    
    CALCEYE --> THREYE{EAR < 0.29?}
    CALCMOUTH --> THRMOUTH{MAR > 0.45?}
    
    THREYE -->|Sí| EYESCLOSED[👁️ Ojos cerrados<br/>Incrementar contador]
    THREYE -->|No| EYESOPEN[👁️ Ojos abiertos]
    
    THRMOUTH -->|Sí| YAWNING[😴 Bostezo<br/>Incrementar contador]
    THRMOUTH -->|No| NORMAL[😊 Normal]
    
    EYESCLOSED --> TIME1{> 1 segundo?}
    TIME1 -->|Sí| EVENT1[Emitir evento<br/>'eyes_closed']
    TIME1 -->|No| WAIT1[Esperar...]
    
    YAWNING --> TIME2{> 1.5 segundos?}
    TIME2 -->|Sí| EVENT2[Emitir evento<br/>'yawning']
    TIME2 -->|No| WAIT2[Esperar...]
    
    EVENT1 --> CHECK{Ambos eventos<br/>activos?}
    EVENT2 --> CHECK
    
    CHECK -->|Sí| CRITICAL[🚨 CRÍTICO<br/>Alerta sonora]
    CHECK -->|No| UPDATE[Actualizar UI<br/>métricas]
    
    CRITICAL --> SAVE[Guardar en DB<br/>+ WebSocket broadcast]
    UPDATE --> SAVE
    
    EYESOPEN --> UPDATE
    NORMAL --> UPDATE
    WAIT1 --> UPDATE
    WAIT2 --> UPDATE
    
    SAVE --> END
    
    style START fill:#4CAF50,stroke:#2E7D32,color:#fff
    style CRITICAL fill:#F44336,stroke:#C62828,color:#fff
    style EVENT1 fill:#FF9800,stroke:#F57C00,color:#fff
    style EVENT2 fill:#FF9800,stroke:#F57C00,color:#fff
    style END fill:#9E9E9E,stroke:#616161,color:#fff
```


**Autor:** Rogeero Daniel Montufar Merma  
**Proyecto:** VISION - Sistema de Detección de Somnolencia  
**Fecha:** Octubre 2025

