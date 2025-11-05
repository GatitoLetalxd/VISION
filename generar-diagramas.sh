#!/bin/bash

# ============================================
# SCRIPT PARA GENERAR DIAGRAMAS PNG
# ============================================

echo "🎨 Generador de Diagramas VISION"
echo "================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Crear directorio para diagramas
DIAGRAM_DIR="diagrams"
mkdir -p "$DIAGRAM_DIR"

echo -e "${BLUE}📁 Directorio creado: $DIAGRAM_DIR${NC}"
echo ""

# Verificar si mermaid-cli está instalado
if ! command -v mmdc &> /dev/null; then
    echo -e "${YELLOW}⚠️  mermaid-cli no está instalado${NC}"
    echo ""
    echo "Opciones:"
    echo ""
    echo "1️⃣  Instalar globalmente (requiere npm):"
    echo "   npm install -g @mermaid-js/mermaid-cli"
    echo ""
    echo "2️⃣  Usar Docker (sin instalación):"
    echo "   docker run --rm -v \$(pwd):/data minlag/mermaid-cli -i /data/DIAGRAMA_FLUJO.md -o /data/diagrams/"
    echo ""
    echo "3️⃣  Usar Mermaid Live Editor (manual):"
    echo "   → https://mermaid.live/"
    echo "   → Copiar y pegar cada diagrama"
    echo "   → Descargar como PNG/SVG"
    echo ""
    echo "4️⃣  Ver en GitHub (automático):"
    echo "   → Los diagramas Mermaid se renderizan automáticamente"
    echo "   → Solo sube DIAGRAMA_FLUJO.md a GitHub"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ mermaid-cli instalado${NC}"
echo ""

# Extraer y generar cada diagrama
echo -e "${BLUE}📊 Generando diagramas...${NC}"
echo ""

# Contador
count=0

# Función para extraer diagramas mermaid del archivo
extract_diagrams() {
    local file="DIAGRAMA_FLUJO.md"
    local in_mermaid=false
    local diagram_num=0
    local diagram_content=""
    local diagram_title=""
    
    while IFS= read -r line; do
        # Detectar inicio de diagrama
        if [[ "$line" =~ ^\`\`\`mermaid ]]; then
            in_mermaid=true
            diagram_num=$((diagram_num + 1))
            diagram_content=""
            continue
        fi
        
        # Detectar fin de diagrama
        if [[ "$line" =~ ^\`\`\`$ ]] && [ "$in_mermaid" = true ]; then
            in_mermaid=false
            
            # Generar archivo temporal
            local temp_file="temp_diagram_${diagram_num}.mmd"
            echo "$diagram_content" > "$temp_file"
            
            # Generar PNG
            local output_file="$DIAGRAM_DIR/diagrama_${diagram_num}.png"
            echo -e "${YELLOW}⏳ Generando diagrama ${diagram_num}...${NC}"
            
            if mmdc -i "$temp_file" -o "$output_file" -b transparent -t dark 2>/dev/null; then
                echo -e "${GREEN}✅ Generado: $output_file${NC}"
                count=$((count + 1))
            else
                echo -e "${RED}❌ Error generando diagrama ${diagram_num}${NC}"
            fi
            
            # Limpiar archivo temporal
            rm -f "$temp_file"
            
            continue
        fi
        
        # Acumular contenido del diagrama
        if [ "$in_mermaid" = true ]; then
            diagram_content="${diagram_content}${line}"$'\n'
        fi
    done < "$file"
}

# Ejecutar extracción
if [ -f "DIAGRAMA_FLUJO.md" ]; then
    extract_diagrams
    echo ""
    echo -e "${GREEN}=================================${NC}"
    echo -e "${GREEN}✅ Generación completada${NC}"
    echo -e "${GREEN}=================================${NC}"
    echo ""
    echo -e "${BLUE}📊 Total de diagramas generados: ${count}${NC}"
    echo ""
    echo "📁 Ubicación: ./$DIAGRAM_DIR/"
    ls -lh "$DIAGRAM_DIR/"/*.png 2>/dev/null
    echo ""
    echo -e "${GREEN}🎉 ¡Listo! Puedes usar estos PNG en documentación, presentaciones, etc.${NC}"
else
    echo -e "${RED}❌ No se encontró DIAGRAMA_FLUJO.md${NC}"
    exit 1
fi

