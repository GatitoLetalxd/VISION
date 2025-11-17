#!/bin/bash

# ============================================
# SCRIPT DE INSTALACION SISTEMA HIBRIDO
# ============================================

echo "VISION - Instalacion Sistema Hibrido"
echo "====================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Directorio del proyecto
PROJECT_DIR="/var/www/VISION"
cd "$PROJECT_DIR" || exit 1

echo -e "${BLUE}Paso 1: Actualizar base de datos${NC}"
echo "--------------------------------"
echo ""

# Verificar si MySQL esta corriendo
if ! systemctl is-active --quiet mysql; then
    echo -e "${RED}ERROR: MySQL no esta corriendo${NC}"
    echo "Ejecuta: sudo systemctl start mysql"
    exit 1
fi

echo "Ingresa la contraseña de MySQL root:"
mysql -u root -p sistema_alerta < backend/database/add_detection_model_config_safe.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Base de datos actualizada correctamente${NC}"
else
    echo -e "${RED}ERROR al actualizar base de datos${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}Paso 2: Actualizar backend Node.js${NC}"
echo "-----------------------------------"
echo ""

cd "$PROJECT_DIR/backend" || exit 1

# Instalar dependencias
echo "Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Dependencias del backend instaladas${NC}"
else
    echo -e "${RED}ERROR instalando dependencias del backend${NC}"
    exit 1
fi

# Reiniciar backend
echo "Reiniciando backend..."
pm2 restart vision-backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Backend reiniciado${NC}"
else
    echo -e "${YELLOW}Advertencia: No se pudo reiniciar con PM2${NC}"
fi
echo ""

echo -e "${BLUE}Paso 3: Actualizar frontend React${NC}"
echo "----------------------------------"
echo ""

cd "$PROJECT_DIR" || exit 1

# Instalar dependencias
echo "Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Dependencias del frontend instaladas${NC}"
else
    echo -e "${RED}ERROR instalando dependencias del frontend${NC}"
    exit 1
fi

# Build frontend
echo "Compilando frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Frontend compilado${NC}"
else
    echo -e "${YELLOW}Advertencia: Error al compilar frontend${NC}"
fi

# Reiniciar frontend
echo "Reiniciando frontend..."
pm2 restart vision-frontend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Frontend reiniciado${NC}"
else
    echo -e "${YELLOW}Advertencia: No se pudo reiniciar con PM2${NC}"
fi
echo ""

echo -e "${BLUE}Paso 4: Configurar servicio Python (Opcional)${NC}"
echo "-----------------------------------------------"
echo ""

read -p "Deseas instalar el servicio Python MediaPipe? (s/n): " install_python

if [[ "$install_python" =~ ^[Ss]$ ]]; then
    cd "$PROJECT_DIR/vision-service" || exit 1
    
    # Verificar Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}ERROR: Python 3 no esta instalado${NC}"
        echo "Instala Python 3: sudo apt install python3 python3-venv python3-pip"
        exit 1
    fi
    
    # Crear entorno virtual
    if [ ! -d "venv" ]; then
        echo "Creando entorno virtual Python..."
        python3 -m venv venv
    fi
    
    # Activar entorno
    source venv/bin/activate
    
    # Instalar dependencias
    echo "Instalando dependencias Python..."
    pip install -r requirements.txt
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Dependencias Python instaladas${NC}"
    else
        echo -e "${RED}ERROR instalando dependencias Python${NC}"
        exit 1
    fi
    
    # Configurar .env si no existe
    if [ ! -f ".env" ]; then
        echo "Creando archivo .env..."
        cp env.example .env
        echo -e "${YELLOW}IMPORTANTE: Edita vision-service/.env con tu configuracion${NC}"
    fi
    
    # Configurar PM2
    cd "$PROJECT_DIR" || exit 1
    
    # Verificar si ya existe la app en PM2
    if pm2 list | grep -q "vision-python"; then
        echo "Reiniciando servicio Python..."
        pm2 restart vision-python
    else
        echo "Agregando servicio Python a PM2..."
        pm2 start ecosystem.config.cjs --only vision-python
    fi
    
    pm2 save
    
    echo -e "${GREEN}Servicio Python configurado${NC}"
else
    echo "Servicio Python omitido"
fi
echo ""

echo -e "${BLUE}Paso 5: Verificar instalacion${NC}"
echo "-------------------------------"
echo ""

# Verificar backend
echo "Verificando backend..."
if curl -k -s https://localhost:5005/api/health > /dev/null; then
    echo -e "${GREEN}Backend: OK${NC}"
else
    echo -e "${RED}Backend: ERROR${NC}"
fi

# Verificar modelos disponibles
echo "Verificando API de modelos..."
if curl -k -s https://localhost:5005/api/detection/models > /dev/null; then
    echo -e "${GREEN}API de modelos: OK${NC}"
else
    echo -e "${RED}API de modelos: ERROR${NC}"
fi

# Verificar servicio Python (si se instalo)
if [[ "$install_python" =~ ^[Ss]$ ]]; then
    echo "Verificando servicio Python..."
    if curl -k -s https://localhost:8000/health > /dev/null; then
        echo -e "${GREEN}Servicio Python: OK${NC}"
    else
        echo -e "${RED}Servicio Python: ERROR${NC}"
        echo "Verifica logs: pm2 logs vision-python"
    fi
fi

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}INSTALACION COMPLETADA${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo "Servicios disponibles:"
echo "- Backend Node.js: https://localhost:5005"
echo "- Frontend React: https://localhost:5175"

if [[ "$install_python" =~ ^[Ss]$ ]]; then
    echo "- Servicio Python: https://localhost:8000"
fi

echo ""
echo "Ver logs:"
echo "  pm2 logs vision-backend"
echo "  pm2 logs vision-frontend"

if [[ "$install_python" =~ ^[Ss]$ ]]; then
    echo "  pm2 logs vision-python"
fi

echo ""
echo "Siguiente paso:"
echo "1. Abre https://localhost:5175 en tu navegador"
echo "2. Inicia sesion"
echo "3. Ve a Configuracion → Modelo de Deteccion"
echo "4. Selecciona el modelo que prefieras"
echo ""
echo "Documentacion: SISTEMA_HIBRIDO.md"
echo ""

