#!/bin/bash

# ============================================
# SCRIPT DE COMMIT SEGURO PARA VISION
# ============================================

echo "🚀 VISION - Script de Commit a GitHub"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. VERIFICACIONES DE SEGURIDAD
echo -e "${BLUE}📋 PASO 1: Verificaciones de seguridad...${NC}"
echo ""

# Verificar si hay archivos .env sin ignorar
echo "Verificando archivos .env..."
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo -e "${RED}❌ ERROR: Archivo .env está siendo rastreado por Git!${NC}"
    echo "Ejecuta: git rm --cached .env"
    exit 1
fi
echo -e "${GREEN}✅ Archivos .env correctamente ignorados${NC}"

# Verificar node_modules
echo "Verificando node_modules..."
if git ls-files --error-unmatch node_modules 2>/dev/null; then
    echo -e "${RED}❌ ERROR: node_modules está siendo rastreado!${NC}"
    echo "Ejecuta: git rm -r --cached node_modules"
    exit 1
fi
echo -e "${GREEN}✅ node_modules correctamente ignorado${NC}"

# Verificar venv
echo "Verificando venv..."
if git ls-files --error-unmatch vision-service/venv 2>/dev/null; then
    echo -e "${RED}❌ ERROR: venv está siendo rastreado!${NC}"
    echo "Ejecuta: git rm -r --cached vision-service/venv"
    exit 1
fi
echo -e "${GREEN}✅ venv correctamente ignorado${NC}"

echo ""
echo -e "${GREEN}✅ Todas las verificaciones de seguridad pasadas${NC}"
echo ""

# 2. MOSTRAR ESTADO
echo -e "${BLUE}📋 PASO 2: Estado actual del repositorio${NC}"
echo ""
git status
echo ""

# 3. CONFIRMAR CON USUARIO
echo -e "${YELLOW}❓ ¿Deseas continuar con el commit? (s/n)${NC}"
read -r respuesta

if [[ ! "$respuesta" =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ Commit cancelado${NC}"
    exit 0
fi

# 4. AGREGAR ARCHIVOS
echo ""
echo -e "${BLUE}📋 PASO 3: Agregando archivos...${NC}"
git add .

echo ""
echo -e "${GREEN}✅ Archivos agregados${NC}"
echo ""

# 5. MOSTRAR ARCHIVOS QUE SE COMMITEARÁN
echo -e "${BLUE}📋 PASO 4: Archivos que se commitearán:${NC}"
echo ""
git status --short
echo ""

# 6. ESTADÍSTICAS
echo -e "${BLUE}📊 Estadísticas:${NC}"
echo "Archivos modificados: $(git diff --cached --numstat | wc -l)"
echo "Líneas agregadas: +$(git diff --cached --numstat | awk '{sum+=$1} END {print sum}')"
echo "Líneas eliminadas: -$(git diff --cached --numstat | awk '{sum+=$2} END {print sum}')"
echo ""

# 7. SOLICITAR MENSAJE DE COMMIT
echo -e "${YELLOW}💬 Ingresa el mensaje del commit:${NC}"
echo "(Por defecto: 'Update: Sistema VISION con documentación completa')"
read -r mensaje_commit

if [ -z "$mensaje_commit" ]; then
    mensaje_commit="🚀 Update: Sistema VISION con documentación completa

- Sistema de detección de somnolencia en tiempo real
- Frontend: React + TypeScript + Vite + Material-UI  
- Backend: Node.js + Express + MySQL + Socket.IO
- IA: face-api.js con EAR y MAR
- RBAC: Admin, Operador, Viewer
- Documentación académica con 24 referencias
- Optimizaciones de rendimiento
- Autor: Rogeero Daniel Montufar Merma"
fi

# 8. HACER COMMIT
echo ""
echo -e "${BLUE}📋 PASO 5: Haciendo commit...${NC}"
git commit -m "$mensaje_commit"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Commit realizado exitosamente${NC}"
else
    echo ""
    echo -e "${RED}❌ Error al hacer commit${NC}"
    exit 1
fi

# 9. PREGUNTAR SI DESEA PUSH
echo ""
echo -e "${YELLOW}❓ ¿Deseas hacer push a GitHub ahora? (s/n)${NC}"
read -r hacer_push

if [[ "$hacer_push" =~ ^[Ss]$ ]]; then
    echo ""
    echo -e "${YELLOW}💬 Ingresa el nombre del remote (por defecto: origin):${NC}"
    read -r remote_name
    remote_name=${remote_name:-origin}
    
    echo -e "${YELLOW}💬 Ingresa el nombre de la rama (por defecto: main):${NC}"
    read -r branch_name
    branch_name=${branch_name:-main}
    
    echo ""
    echo -e "${BLUE}📋 PASO 6: Haciendo push a $remote_name/$branch_name...${NC}"
    git push -u "$remote_name" "$branch_name"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅✅✅ ¡Push exitoso! ✅✅✅${NC}"
        echo ""
        echo -e "${GREEN}🎉 Tu proyecto VISION está ahora en GitHub 🎉${NC}"
    else
        echo ""
        echo -e "${RED}❌ Error al hacer push${NC}"
        echo ""
        echo -e "${YELLOW}Posibles soluciones:${NC}"
        echo "1. Verifica que el remote esté configurado: git remote -v"
        echo "2. Verifica tu autenticación SSH: ssh -T git@github.com"
        echo "3. Si el remote no existe, agrégalo:"
        echo "   git remote add origin git@github.com:tu-usuario/VISION.git"
        exit 1
    fi
else
    echo ""
    echo -e "${YELLOW}⏸️  Commit realizado pero NO se hizo push${NC}"
    echo ""
    echo "Para hacer push manualmente ejecuta:"
    echo -e "${BLUE}git push -u origin main${NC}"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ PROCESO COMPLETADO${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "📊 Ver commits: git log --oneline"
echo "📋 Ver remotes: git remote -v"
echo "🌿 Ver branches: git branch -a"
echo ""

