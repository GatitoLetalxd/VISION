# CONFIGURACION DE PUERTOS - VISION

## Puertos del Sistema

Tu proyecto VISION utiliza los siguientes puertos:

### Frontend React
- Puerto: **5175**
- Protocolo: HTTPS
- URL: https://localhost:5175
- Gestionado por: PM2 (vision-frontend)
- Comando: `npm run dev` (Vite)

### Backend Node.js
- Puerto: **5005**
- Protocolo: HTTPS
- URL: https://localhost:5005
- Gestionado por: PM2 (vision-backend)
- API Base: https://localhost:5005/api

### Servicio Python (MediaPipe)
- Puerto: **8000**
- Protocolo: HTTPS
- URL: https://localhost:8000
- Gestionado por: PM2 (vision-python) - Opcional
- Framework: FastAPI con Uvicorn

---

## Verificar Servicios

```bash
# Ver estado de todos los servicios PM2
pm2 status

# Debe mostrar:
# vision-backend  (puerto 5005)
# vision-frontend (puerto 5175)
# vision-python   (puerto 8000) - opcional

# Verificar puertos en uso
netstat -tuln | grep -E '5005|5175|8000'

# Verificar salud de servicios
curl -k https://localhost:5005/api/health    # Backend
curl -k https://localhost:5175               # Frontend
curl -k https://localhost:8000/health        # Python (si esta instalado)
```

---

## Configuracion de Firewall (UFW)

Si usas UFW, asegurate de que los puertos esten abiertos:

```bash
# Verificar estado
sudo ufw status

# Abrir puertos si es necesario
sudo ufw allow 5005/tcp  comment 'VISION Backend'
sudo ufw allow 5175/tcp  comment 'VISION Frontend'
sudo ufw allow 8000/tcp  comment 'VISION Python'  # opcional

# Recargar firewall
sudo ufw reload
```

---

## Variables de Entorno

### Frontend (.env o .env.local)
```bash
# Puerto del frontend (Vite)
PORT=5175
VITE_PORT=5175

# URL del backend
VITE_API_URL=https://localhost:5005

# URL del servicio Python (opcional)
VITE_PYTHON_SERVICE_URL=https://localhost:8000
```

### Backend (.env)
```bash
# Puerto del backend
PORT=5005

# CORS - Permitir frontend
ALLOWED_ORIGINS=https://localhost:5175,https://IP_SERVIDOR:5175
```

### Python (vision-service/.env)
```bash
# Puerto del servicio Python
HOST=0.0.0.0
PORT=8000

# URL del backend
BACKEND_URL=https://localhost:5005
```

---

## PM2 Ecosystem

Tu archivo `ecosystem.config.cjs` deberia tener:

```javascript
module.exports = {
  apps: [
    {
      name: 'vision-backend',
      script: 'npm',
      args: 'run dev',
      cwd: '/var/www/VISION/backend',
      watch: false,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5005
      }
    },
    {
      name: 'vision-frontend',
      script: 'npm',
      args: 'run dev -- --port 5175 --host 0.0.0.0',
      cwd: '/var/www/VISION',
      watch: false,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'vision-python',
      script: 'venv/bin/uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8000 --ssl-keyfile ../.cert/key.pem --ssl-certfile ../.cert/cert.pem',
      cwd: '/var/www/VISION/vision-service',
      watch: false,
      exec_mode: 'fork'
    }
  ]
};
```

---

## Acceso desde Otros Dispositivos

Si quieres acceder desde otros dispositivos en la misma red:

### 1. Obtener IP del servidor
```bash
ip addr show | grep 'inet ' | grep -v '127.0.0.1'
# Ejemplo: 100.73.162.98
```

### 2. Acceder desde otro dispositivo
```
Frontend: https://100.73.162.98:5175
Backend:  https://100.73.162.98:5005
Python:   https://100.73.162.98:8000
```

### 3. Aceptar certificados SSL
- Navega primero a https://100.73.162.98:5005/api/health
- Acepta el certificado autofirmado
- Luego accede a https://100.73.162.98:5175

---

## Troubleshooting

### Problema: Puerto 5175 ya en uso

```bash
# Ver que esta usando el puerto
lsof -i :5175

# Matar proceso si es necesario
kill -9 PID

# O reiniciar PM2
pm2 restart vision-frontend
```

### Problema: No puedo acceder desde otro dispositivo

```bash
# Verificar que el servicio escucha en 0.0.0.0 (no solo localhost)
netstat -tuln | grep 5175

# Debe mostrar: 0.0.0.0:5175
# Si muestra: 127.0.0.1:5175 → cambiar configuracion

# Verificar firewall
sudo ufw status
```

### Problema: ERR_CONNECTION_REFUSED

1. Verificar que el servicio esta corriendo:
   ```bash
   pm2 status
   pm2 logs vision-frontend
   ```

2. Verificar puerto correcto:
   ```bash
   netstat -tuln | grep 5175
   ```

3. Verificar certificados SSL aceptados

---

## Cambiar Puertos

Si necesitas cambiar los puertos:

### Frontend (5175 → NUEVO_PUERTO)

1. Actualizar `package.json`:
   ```json
   "scripts": {
     "dev": "vite --port NUEVO_PUERTO --host 0.0.0.0"
   }
   ```

2. Actualizar `ecosystem.config.cjs`:
   ```javascript
   args: 'run dev -- --port NUEVO_PUERTO --host 0.0.0.0'
   ```

3. Actualizar firewall:
   ```bash
   sudo ufw allow NUEVO_PUERTO/tcp
   ```

4. Reiniciar:
   ```bash
   pm2 restart vision-frontend
   ```

### Backend (5005 → NUEVO_PUERTO)

1. Actualizar `backend/.env`:
   ```
   PORT=NUEVO_PUERTO
   ```

2. Actualizar `ecosystem.config.cjs`

3. Actualizar frontend `.env`:
   ```
   VITE_API_URL=https://localhost:NUEVO_PUERTO
   ```

4. Reiniciar ambos servicios

---

## Resumen Rapido

```
Frontend:  https://localhost:5175  (PM2: vision-frontend)
Backend:   https://localhost:5005  (PM2: vision-backend)
Python:    https://localhost:8000  (PM2: vision-python)

Comandos utiles:
  pm2 status
  pm2 logs vision-frontend
  pm2 restart all
  
Firewall:
  sudo ufw allow 5175/tcp
  sudo ufw allow 5005/tcp
  sudo ufw allow 8000/tcp
```

---

**Autor:** Rogeero Daniel Montufar Merma
**Proyecto:** VISION - Sistema de Deteccion de Somnolencia
**Fecha:** Noviembre 2025

