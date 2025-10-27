# 📦 INSTRUCCIONES PARA SUBIR A GITHUB

## Sistema VISION - Detección de Somnolencia

---

## ⚠️ ANTES DE HACER COMMIT

### 1. **VERIFICAR CREDENCIALES SENSIBLES**

**CRÍTICO:** Antes de subir a GitHub, asegúrate de que NO subes credenciales:

```bash
# Revisar el archivo de configuración de base de datos
cat backend/src/config/database.js
```

**Opción A: Usar variables de entorno (RECOMENDADO)**
```javascript
// backend/src/config/database.js
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // ⚠️ NO poner password real aquí
  database: process.env.DB_NAME || 'vision_db',
  port: process.env.DB_PORT || 3306
});
```

**Opción B: Crear archivo de ejemplo**
```bash
# Crear un archivo de ejemplo sin credenciales
cp backend/src/config/database.js backend/src/config/database.example.js

# Editar database.example.js y reemplazar credenciales por placeholders
# Luego agregar database.js al .gitignore
echo "backend/src/config/database.js" >> .gitignore
```

---

## 🔧 CONFIGURAR GIT (Primera vez)

### 1. **Configurar identidad Git**

```bash
# Configurar nombre y email (usar tu cuenta de GitHub)
git config --global user.name "Rogeero Daniel Montufar Merma"
git config --global user.email "tu_email@ejemplo.com"

# Verificar configuración
git config --list
```

### 2. **Generar SSH Key (si no tienes)**

```bash
# Generar nueva SSH key
ssh-keygen -t ed25519 -C "tu_email@ejemplo.com"

# Presiona Enter 3 veces (usar ubicación por defecto y sin contraseña)

# Copiar la clave pública
cat ~/.ssh/id_ed25519.pub

# Agregar esta clave en GitHub:
# https://github.com/settings/keys → New SSH key
```

---

## 📤 PASOS PARA SUBIR A GITHUB

### **OPCIÓN 1: Nuevo Repositorio (desde cero)**

```bash
# 1. Ir al directorio del proyecto
cd /var/www/VISION

# 2. Inicializar Git (si no está inicializado)
git init

# 3. Agregar todos los archivos
git add .

# 4. Ver qué archivos se agregarán
git status

# 5. Hacer el primer commit
git commit -m "🚀 Initial commit: VISION - Sistema de Detección de Somnolencia

- Sistema completo de detección de somnolencia en tiempo real
- Frontend: React + TypeScript + Vite + Material-UI
- Backend: Node.js + Express + MySQL + Socket.IO
- IA: face-api.js con TinyFaceDetector, FaceLandmark68Net
- Algoritmos: EAR (Eye Aspect Ratio) y MAR (Mouth Aspect Ratio)
- Roles: Admin, Operador, Viewer (RBAC)
- Documentación completa con referencias académicas
- Autor: Rogeero Daniel Montufar Merma"

# 6. Crear repositorio en GitHub
# Ir a: https://github.com/new
# Nombre: VISION
# Descripción: Sistema de Detección de Somnolencia en Conductores
# Público o Privado: Tú decides
# NO marcar: Initialize with README, .gitignore, license

# 7. Conectar con GitHub (reemplazar 'tu-usuario')
git remote add origin git@github.com:tu-usuario/VISION.git

# 8. Renombrar rama a 'main' (si es necesario)
git branch -M main

# 9. Subir al repositorio
git push -u origin main
```

---

### **OPCIÓN 2: Repositorio Existente**

```bash
# 1. Ir al directorio del proyecto
cd /var/www/VISION

# 2. Verificar si ya hay repositorio Git
git status

# Si NO hay repositorio:
git init

# 3. Verificar remotes existentes
git remote -v

# Si hay remote incorrecto, eliminarlo:
git remote remove origin

# 4. Agregar tu repositorio de GitHub
git remote add origin git@github.com:tu-usuario/VISION.git

# 5. Agregar todos los archivos
git add .

# 6. Hacer commit
git commit -m "🚀 Update: Sistema VISION completo con documentación"

# 7. Subir
git push -u origin main

# Si hay conflictos:
git pull origin main --rebase
git push -u origin main
```

---

## 📋 COMANDOS GIT ÚTILES

### **Ver estado actual**
```bash
git status                    # Ver archivos modificados
git log --oneline            # Ver historial de commits
git diff                     # Ver cambios no commiteados
```

### **Agregar archivos**
```bash
git add .                    # Agregar todos los archivos
git add archivo.js           # Agregar archivo específico
git add src/                 # Agregar directorio completo
```

### **Commits**
```bash
git commit -m "Mensaje"      # Commit con mensaje
git commit --amend           # Modificar último commit
git reset HEAD~1             # Deshacer último commit (mantener cambios)
```

### **Ver qué se subirá**
```bash
git diff --cached            # Ver cambios en staging area
git diff HEAD                # Ver todos los cambios
git ls-files                 # Ver archivos rastreados por Git
```

### **Ignorar archivos después de commit**
```bash
# Si ya commiteaste archivos que ahora quieres ignorar:
git rm -r --cached node_modules/
git rm --cached .env
git commit -m "🔧 Remove ignored files from tracking"
```

---

## 🏷️ CREAR TAGS (Versiones)

```bash
# Crear tag para versión 1.0.0
git tag -a v1.0.0 -m "🎉 Version 1.0.0: Sistema VISION completo

- Detección de somnolencia en tiempo real
- RBAC implementado
- Documentación académica completa
- Optimizaciones de rendimiento"

# Ver tags
git tag

# Subir tags a GitHub
git push origin --tags

# Ver información de un tag
git show v1.0.0
```

---

## 📝 CONVENCIONES DE COMMITS

### **Formato recomendado:**
```
<tipo>(<scope>): <mensaje corto>

<descripción detallada (opcional)>

<footer (opcional)>
```

### **Tipos de commit:**
```
✨ feat:      Nueva funcionalidad
🐛 fix:       Corrección de bug
📚 docs:      Documentación
💄 style:     Formato, estilo (sin cambios de código)
♻️  refactor:  Refactorización de código
⚡ perf:      Mejora de rendimiento
✅ test:      Agregar o modificar tests
🔧 chore:     Mantenimiento, configuración
🚀 deploy:    Despliegue
🔒 security:  Seguridad
```

### **Ejemplos:**
```bash
git commit -m "✨ feat(drowsiness): agregar detección de bostezo"
git commit -m "🐛 fix(auth): corregir error de login con roles"
git commit -m "📚 docs: agregar referencias bibliográficas"
git commit -m "⚡ perf(detection): optimizar EAR calculation"
git commit -m "🔒 security: implementar rate limiting en API"
```

---

## 🌿 BRANCHES (Ramas)

### **Crear y usar branches:**
```bash
# Ver branches
git branch

# Crear nueva branch
git checkout -b feature/nueva-funcionalidad

# Cambiar de branch
git checkout main

# Hacer cambios, commit y push a la nueva branch
git add .
git commit -m "✨ feat: nueva funcionalidad"
git push -u origin feature/nueva-funcionalidad

# Merge a main (después de aprobar)
git checkout main
git merge feature/nueva-funcionalidad
git push
```

---

## 🔍 VERIFICAR ANTES DE COMMIT

### **Checklist de seguridad:**

```bash
# 1. Verificar que NO subes credenciales
grep -r "password.*=" backend/src/ | grep -v "process.env"
grep -r "DB_PASSWORD" backend/src/ | grep -v "process.env"

# 2. Verificar que .env NO está en staging
git status | grep ".env"

# 3. Verificar tamaño de archivos
find . -type f -size +10M | grep -v node_modules | grep -v ".git"

# 4. Ver archivos que se subirán
git ls-files

# 5. Verificar que node_modules está ignorado
git check-ignore node_modules/
# Debe decir: node_modules/
```

---

## 📦 CREAR README.md para GitHub

```bash
# El README.md ya debería existir, pero si no:
cat > README.md << 'EOF'
# 🚗👁️ VISION - Sistema de Detección de Somnolencia

Sistema inteligente de detección de somnolencia en conductores en tiempo real utilizando visión por computadora y aprendizaje profundo.

## 🎯 Características

- ✨ Detección en tiempo real (10 FPS)
- 👁️ Algoritmo EAR (Eye Aspect Ratio)
- 😴 Detección de bostezos con MAR
- 🔔 Alertas sonoras críticas
- 📊 Métricas y estadísticas en vivo
- 👥 Sistema de roles (Admin, Operador, Viewer)
- 🔒 Procesamiento local (Privacy by Design)

## 🛠️ Tecnologías

- **Frontend:** React 18 + TypeScript + Vite + Material-UI
- **Backend:** Node.js + Express + MySQL
- **IA:** face-api.js + TensorFlow.js
- **Tiempo Real:** Socket.IO
- **Seguridad:** JWT + bcrypt + Helmet

## 📚 Documentación

- [Arquitectura del Sistema](ARQUITECTURA.md)
- [Modelos de IA](MODELOS_IA.md)
- [Referencias Bibliográficas](REFERENCIAS_BIBLIOGRAFICAS.md)
- [Diagramas](DIAGRAMA_SIMPLE.md)

## 🚀 Instalación

Ver [INSTALL.md](INSTALL.md) para instrucciones detalladas.

## 👨‍💻 Autor

**Rogeero Daniel Montufar Merma**
Octubre 2025

## 📄 Licencia

MIT License
EOF
```

---

## 🎉 DESPUÉS DE SUBIR A GITHUB

### **1. Configurar GitHub Pages (opcional)**
```
Settings → Pages → Source: main branch → Save
```

### **2. Agregar descripción y topics en GitHub**
```
Topics sugeridos:
- computer-vision
- machine-learning
- drowsiness-detection
- face-detection
- react
- nodejs
- typescript
- tensorflow-js
- socket-io
- real-time
```

### **3. Crear Release**
```
Releases → Create a new release
Tag: v1.0.0
Title: Version 1.0.0 - Sistema VISION Completo
Description: (copiar del commit message)
```

### **4. Proteger rama main**
```
Settings → Branches → Add branch protection rule
Branch: main
☑ Require pull request reviews before merging
```

---

## 📊 ESTADÍSTICAS DEL PROYECTO

```bash
# Ver líneas de código
find src backend/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" | xargs wc -l

# Ver commits por autor
git shortlog -s -n

# Ver archivos más modificados
git log --pretty=format: --name-only | sort | uniq -c | sort -rg | head -10

# Ver tamaño del repositorio
du -sh .git/
```

---

## 🔗 RECURSOS ÚTILES

- **GitHub Docs:** https://docs.github.com/
- **Git Book:** https://git-scm.com/book/es/v2
- **Conventional Commits:** https://www.conventionalcommits.org/
- **Gitignore Templates:** https://github.com/github/gitignore

---

## ⚠️ ERRORES COMUNES

### **Error: "Permission denied (publickey)"**
```bash
# Solución: Agregar SSH key a ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### **Error: "fatal: remote origin already exists"**
```bash
# Solución: Remover y agregar de nuevo
git remote remove origin
git remote add origin git@github.com:tu-usuario/VISION.git
```

### **Error: "Updates were rejected"**
```bash
# Solución: Pull primero
git pull origin main --rebase
git push origin main
```

### **Archivo muy grande**
```bash
# Solución: Remover del historial
git rm --cached archivo_grande.zip
echo "archivo_grande.zip" >> .gitignore
git commit -m "🔧 chore: remove large file"
```

---

**¡Listo para subir tu proyecto a GitHub!** 🚀

**Autor:** Rogeero Daniel Montufar Merma  
**Proyecto:** VISION - Detección de Somnolencia  
**Fecha:** Octubre 2025

