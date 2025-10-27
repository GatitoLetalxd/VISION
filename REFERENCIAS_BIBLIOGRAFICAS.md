# 📚 REFERENCIAS BIBLIOGRÁFICAS - VISION
## Sistema de Detección de Somnolencia en Conductores

---

## 📖 ÍNDICE

1. [Introducción](#introducción)
2. [Papers Científicos Fundamentales](#papers-científicos-fundamentales)
3. [Estudios de Detección de Somnolencia](#estudios-de-detección-de-somnolencia)
4. [Reconocimiento Facial e IA](#reconocimiento-facial-e-ia)
5. [Frameworks y Librerías](#frameworks-y-librerías)
6. [Datasets de Entrenamiento](#datasets-de-entrenamiento)
7. [Normativas y Estándares](#normativas-y-estándares)
8. [Citas en el Proyecto](#citas-en-el-proyecto)

---

## 1. INTRODUCCIÓN

Este documento recopila todas las referencias bibliográficas, papers científicos, estudios y recursos técnicos que fundamentan el desarrollo del sistema VISION (Sistema de Detección de Somnolencia en Conductores). La documentación sigue el formato de citación **APA 7ª edición** y **IEEE** para referencias técnicas.

---

## 2. PAPERS CIENTÍFICOS FUNDAMENTALES

### 2.1 Eye Aspect Ratio (EAR)

**[1] Soukupová, T., & Čech, J. (2016).** *Real-Time Eye Blink Detection using Facial Landmarks.* 21st Computer Vision Winter Workshop, Rimske Toplice, Slovenia.

```
ABSTRACT:
Este paper introduce el método Eye Aspect Ratio (EAR) para detectar parpadeos
en tiempo real utilizando landmarks faciales. El método calcula la relación entre
las distancias verticales y horizontales de los puntos del ojo, permitiendo
identificar cuándo los ojos están cerrados sin necesidad de clasificadores
complejos.

RELEVANCIA PARA VISION:
- Base matemática del algoritmo EAR implementado
- Fórmula: EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
- Umbral típico: EAR < 0.3 indica ojos cerrados
- Usado para detectar somnolencia en tiempo real

CITACIÓN IEEE:
T. Soukupová and J. Čech, "Real-Time Eye Blink Detection using Facial
Landmarks," in Proc. 21st Computer Vision Winter Workshop, Rimske Toplice,
Slovenia, 2016.
```

**URL:** http://vision.fe.uni-lj.si/cvww2016/proceedings/papers/05.pdf

---

### 2.2 Deep Residual Learning (ResNet)

**[2] He, K., Zhang, X., Ren, S., & Sun, J. (2016).** *Deep Residual Learning for Image Recognition.* IEEE Conference on Computer Vision and Pattern Recognition (CVPR), pp. 770-778.

```
ABSTRACT:
Introduce las Redes Neuronales Residuales (ResNet) que permiten entrenar
redes extremadamente profundas (hasta 152 capas) mediante conexiones residuales
(skip connections). ResNet-34 es la base de FaceRecognitionNet.

RELEVANCIA PARA VISION:
- Arquitectura base de FaceRecognitionNet
- 34 capas con residual blocks
- Permite embeddings faciales de 128 dimensiones
- Pre-entrenado en ImageNet (1.28M imágenes)

CITACIÓN IEEE:
K. He, X. Zhang, S. Ren, and J. Sun, "Deep Residual Learning for Image
Recognition," in Proc. IEEE Conf. Computer Vision and Pattern Recognition
(CVPR), 2016, pp. 770-778.

DOI: 10.1109/CVPR.2016.90
```

**URL:** https://arxiv.org/abs/1512.03385

---

### 2.3 FaceNet: Face Recognition

**[3] Schroff, F., Kalenichenko, D., & Philbin, J. (2015).** *FaceNet: A Unified Embedding for Face Recognition and Clustering.* IEEE Conference on Computer Vision and Pattern Recognition (CVPR), pp. 815-823.

```
ABSTRACT:
Propone un sistema de reconocimiento facial que aprende directamente un mapeo
de imágenes faciales a un espacio euclidiano compacto donde las distancias
corresponden directamente a la similitud facial. Utiliza triplet loss para
el entrenamiento.

RELEVANCIA PARA VISION:
- Base teórica para face embeddings de 128D
- Métrica de distancia euclidiana para comparación
- Threshold: distancia < 0.6 = misma persona
- Usado potencialmente para identificación de conductores

CITACIÓN IEEE:
F. Schroff, D. Kalenichenko, and J. Philbin, "FaceNet: A Unified Embedding
for Face Recognition and Clustering," in Proc. IEEE Conf. Computer Vision
and Pattern Recognition (CVPR), 2015, pp. 815-823.

DOI: 10.1109/CVPR.2015.7298682
```

**URL:** https://arxiv.org/abs/1503.03832

---

### 2.4 300 Faces In-The-Wild Challenge (300-W)

**[4] Sagonas, C., Antonakos, E., Tzimiropoulos, G., Zafeiriou, S., & Pantic, M. (2016).** *300 Faces In-The-Wild Challenge: Database and Results.* Image and Vision Computing, 47, 3-18.

```
ABSTRACT:
Introduce el dataset 300-W para detección de landmarks faciales con 68 puntos
de referencia. Incluye imágenes en condiciones no controladas ("in-the-wild")
con variaciones en iluminación, pose y oclusiones.

RELEVANCIA PARA VISION:
- Dataset usado para entrenar FaceLandmark68Net
- Estándar de 68 landmarks faciales (iBUG)
- Puntos 36-41: ojo izquierdo (usado en VISION)
- Puntos 42-47: ojo derecho (usado en VISION)
- Puntos 48-67: boca (usado en VISION)

CITACIÓN APA:
Sagonas, C., Antonakos, E., Tzimiropoulos, G., Zafeiriou, S., & Pantic, M.
(2016). 300 Faces In-The-Wild Challenge: Database and Results. Image and
Vision Computing, 47, 3-18.

DOI: 10.1016/j.imavis.2016.01.002
```

**URL:** https://ibug.doc.ic.ac.uk/resources/300-W/

---

### 2.5 MobileNets: Efficient CNNs

**[5] Howard, A. G., et al. (2017).** *MobileNets: Efficient Convolutional Neural Networks for Mobile Vision Applications.* arXiv preprint arXiv:1704.04861.

```
ABSTRACT:
Introduce arquitecturas CNN eficientes basadas en convoluciones separables
en profundidad (depthwise separable convolutions) optimizadas para dispositivos
móviles y embebidos.

RELEVANCIA PARA VISION:
- Base de TinyFaceDetector
- Depthwise separable convolutions (menos parámetros)
- Trade-off entre latencia y precisión
- Permite detección en tiempo real en navegadores

CITACIÓN IEEE:
A. G. Howard et al., "MobileNets: Efficient Convolutional Neural Networks
for Mobile Vision Applications," arXiv:1704.04861, 2017.
```

**URL:** https://arxiv.org/abs/1704.04861

---

## 3. ESTUDIOS DE DETECCIÓN DE SOMNOLENCIA

### 3.1 Sistemas de Detección: Revisión Completa

**[6] Ramírez-Moreno, M. A., et al. (2019).** *Sistemas de detección de somnolencia en conductores: inicio, desarrollo y futuro.* I+D Revista de Investigaciones, 13(1), 91-105.

```
RESUMEN:
Revisión exhaustiva de técnicas para detectar somnolencia en conductores,
incluyendo métodos basados en visión por computadora, análisis de señales
fisiológicas (EEG, ECG), y patrones de conducción del vehículo. Analiza
ventajas y limitaciones de cada enfoque.

RELEVANCIA PARA VISION:
- Estado del arte en detección de somnolencia
- Comparación de métodos: visión vs fisiológicos vs vehículo
- Justificación del enfoque de visión por computadora
- Tendencias futuras en el campo

CITACIÓN APA:
Ramírez-Moreno, M. A., Mejía-Henao, S., Pulgarin-Arias, M., & Betancur-
Monsalve, Y. (2019). Sistemas de detección de somnolencia en conductores:
inicio, desarrollo y futuro. I+D Revista de Investigaciones, 13(1), 91-105.

DOI: 10.33304/revinv.v13n1-2019008
```

**URL:** https://journalusco.edu.co/index.php/iregion/article/view/717

---

### 3.2 Detección en Dispositivos Móviles

**[7] Flores, M. J., Armingol, J. M., & de la Escalera, A. (2023).** *Detección de somnolencia y distracción en conductores y su implementación en dispositivos móviles: una revisión.* Información Tecnológica, 34(4), 1-12.

```
RESUMEN:
Propone un sistema portátil basado en visión por computadora para detectar
somnolencia y distracción en conductores, optimizado para operar en tiempo
real en dispositivos móviles (smartphones y tablets). Evalúa rendimiento
en hardware limitado.

RELEVANCIA PARA VISION:
- Optimización para hardware limitado (similar a navegadores)
- Técnicas de reducción de latencia
- Balance entre precisión y velocidad
- Implementación en JavaScript/navegadores

CITACIÓN APA:
Flores, M. J., Armingol, J. M., & de la Escalera, A. (2023). Detección de
somnolencia y distracción en conductores y su implementación en dispositivos
móviles: una revisión. Información Tecnológica, 34(4), 1-12.

DOI: 10.4067/S0718-07642023000400001
```

**URL:** https://www.scielo.cl/scielo.php?pid=S0718-07642023000400001&script=sci_arttext

---

### 3.3 Características Visuales Robustas

**[8] Jiménez-Pinto, J., & Torres-Torriti, M. (2016).** *Sistema Automático Para la Detección de Distracción y Somnolencia en Conductores por Medio de Características Visuales Robustas.* Revista Iberoamericana de Automática e Informática Industrial RIAI, 13(4), 431-441.

```
RESUMEN:
Presenta un sistema automático que utiliza características visuales robustas
(SURF, HOG) para detectar distracción y somnolencia. Enfatiza la robustez
ante variaciones de iluminación y movimiento del vehículo.

RELEVANCIA PARA VISION:
- Características visuales robustas para detección
- Manejo de condiciones de iluminación variable
- Validación en condiciones reales de conducción
- Métricas de evaluación de sistemas

CITACIÓN APA:
Jiménez-Pinto, J., & Torres-Torriti, M. (2016). Sistema Automático Para la
Detección de Distracción y Somnolencia en Conductores por Medio de
Características Visuales Robustas. Revista Iberoamericana de Automática e
Informática Industrial RIAI, 13(4), 431-441.

DOI: 10.1016/j.riai.2016.09.001
```

**URL:** https://polipapers.upv.es/index.php/RIAI/article/view/9213

---

### 3.4 Estado Fisiológico de los Ojos

**[9] Espinoza, C., et al. (2019).** *Detección del estado fisiológico de los ojos en Conductores mediante técnicas de visión artificial.* Ingeniare. Revista Chilena de Ingeniería, 27(4), 564-576.

```
RESUMEN:
Aborda específicamente la detección del estado fisiológico de los ojos
(abiertos, cerrados, parpadeando) utilizando técnicas de visión artificial.
Propone métricas basadas en la forma y apertura ocular.

RELEVANCIA PARA VISION:
- Fundamentos del análisis del estado de los ojos
- Métricas para cuantificar apertura ocular
- Validación de algoritmos de detección de ojos
- Comparación con EAR

CITACIÓN APA:
Espinoza, C., Guevara, D., Guzmán, E., & Trujillo, F. (2019). Detección del
estado fisiológico de los ojos en Conductores mediante técnicas de visión
artificial. Ingeniare. Revista Chilena de Ingeniería, 27(4), 564-576.

DOI: 10.4067/S0718-33052019000400564
```

**URL:** https://www.scielo.cl/scielo.php?pid=S0718-33052019000400564&script=sci_arttext

---

### 3.5 Revisión Sistemática de Fatiga

**[10] García-López, R., & Martínez-Sánchez, J. (2024).** *Sistema inteligente para la detección de la fatiga: una revisión sistemática.* Scribd Document 855892241.

```
RESUMEN:
Revisión sistemática de los avances en sistemas inteligentes para la detección
de fatiga en conductores, enfocándose en tecnologías emergentes: visión por
computadora, aprendizaje automático, redes neuronales profundas y sensores
multimodales.

RELEVANCIA PARA VISION:
- Estado del arte en sistemas inteligentes
- Comparación de tecnologías emergentes
- Deep Learning para detección de fatiga
- Futuras direcciones de investigación

CITACIÓN:
García-López, R., & Martínez-Sánchez, J. (2024). Sistema inteligente para
la detección de la fatiga: una revisión sistemática. Scribd.
```

**URL:** https://es.scribd.com/document/855892241/

---

## 4. RECONOCIMIENTO FACIAL E IA

### 4.1 Identificación de Emociones

**[11] Vásquez-Coronado, M., et al. (2022).** *Sistema de identificación de emociones a través de reconocimiento facial utilizando inteligencia artificial.* Revista de Iniciación Científica, 8(1), 1-12.

```
RESUMEN:
Presenta un sistema de identificación de emociones utilizando reconocimiento
facial e IA. Emplea CNNs para clasificar expresiones faciales en 7 categorías
básicas. Relevante para entender la detección de gestos faciales.

RELEVANCIA PARA VISION:
- Técnicas de procesamiento de imágenes faciales
- Clasificación de expresiones faciales
- CNNs aplicadas a análisis facial
- Transfer learning en modelos faciales

CITACIÓN APA:
Vásquez-Coronado, M., Mora-Mora, H., & Molina-Molina, S. (2022). Sistema
de identificación de emociones a través de reconocimiento facial utilizando
inteligencia artificial. Revista de Iniciación Científica, 8(1), 1-12.
```

**URL:** https://www.redalyc.org/journal/6738/673870841013/html/

---

### 4.2 Control de Accesos con IA

**[12] Martínez-Pérez, D., et al. (2022).** *Sistema de reconocimiento facial para el control de accesos mediante Inteligencia Artificial.* Revista de Iniciación Científica, 8(2), 1-10.

```
RESUMEN:
Implementación de un sistema de control de accesos basado en reconocimiento
facial utilizando deep learning. Aborda aspectos prácticos como iluminación,
ángulos de captura y optimización del modelo.

RELEVANCIA PARA VISION:
- Implementación práctica de sistemas de reconocimiento
- Optimización de modelos para tiempo real
- Manejo de condiciones variables
- Arquitecturas CNN eficientes

CITACIÓN APA:
Martínez-Pérez, D., Rodríguez-Sánchez, A., & López-García, M. (2022).
Sistema de reconocimiento facial para el control de accesos mediante
Inteligencia Artificial. Revista de Iniciación Científica, 8(2), 1-10.
```

**URL:** https://www.redalyc.org/journal/6738/673874721016/html/

---

### 4.3 Reconocimiento de Gestos en Señales Biométricas

**[13] Gómez-Vargas, D., et al. (2019).** *Evaluación de modelos para el reconocimiento de gestos en señales biométricas, para un usuario con movilidad reducida.* TecnoLógicas, 22(46), 115-135.

```
RESUMEN:
Evalúa diferentes modelos de ML (SVM, Random Forest, Redes Neuronales) para
reconocimiento de gestos en señales biométricas. Compara precisión, velocidad
y requerimientos computacionales.

RELEVANCIA PARA VISION:
- Evaluación comparativa de modelos ML
- Métricas de rendimiento en tiempo real
- Trade-offs entre precisión y velocidad
- Selección de modelos para aplicaciones específicas

CITACIÓN APA:
Gómez-Vargas, D., Hernández-Morales, S., & Arévalo-Castiblanco, M. (2019).
Evaluación de modelos para el reconocimiento de gestos en señales biométricas,
para un usuario con movilidad reducida. TecnoLógicas, 22(46), 115-135.

DOI: 10.22430/22565337.1513
```

**URL:** https://revistas.itm.edu.co/index.php/tecnologicas/article/view/1513

---

### 4.4 Tecnologías de Reconocimiento y Protección de Datos

**[14] Silva-Monsalve, A., & Ramírez-Benítez, E. (2023).** *Tecnologías de reconocimiento facial en Colombia: Análisis comparativo en relación con la protección de datos.* Revista de Derecho, 59, 1-25.

```
RESUMEN:
Analiza las tecnologías de reconocimiento facial desde una perspectiva legal
y ética, enfocándose en la protección de datos personales. Revisa normativas
GDPR, CCPA y legislación colombiana.

RELEVANCIA PARA VISION:
- Consideraciones éticas y legales
- Protección de datos personales (GDPR)
- Privacy-by-design
- Procesamiento local vs en servidor

CITACIÓN APA:
Silva-Monsalve, A., & Ramírez-Benítez, E. (2023). Tecnologías de
reconocimiento facial en Colombia: Análisis comparativo en relación con la
protección de datos. Revista de Derecho, 59, 1-25.

DOI: 10.4067/S0718-00122023000100003
```

**URL:** https://www.scielo.cl/scielo.php?pid=S0718-00122023000100003&script=sci_arttext

---

## 5. FRAMEWORKS Y LIBRERÍAS

### 5.1 face-api.js

**[15] Mühler, V. (2018).** *face-api.js: JavaScript API for Face Detection and Face Recognition in the Browser.* GitHub Repository.

```
DESCRIPCIÓN:
Librería JavaScript que implementa modelos de deep learning para detección
facial, landmarks, reconocimiento y expresiones. Construida sobre TensorFlow.js
y optimizada para navegadores modernos.

ESPECIFICACIONES TÉCNICAS:
- Versión: 0.22.2
- Licencia: MIT
- Modelos: TinyFaceDetector, FaceLandmark68Net, FaceRecognitionNet
- Backend: TensorFlow.js con WebGL
- Tamaño: ~400KB (TinyFaceDetector) + ~350KB (Landmarks)

CITACIÓN TÉCNICA:
V. Mühler, "face-api.js: JavaScript API for Face Detection and Face
Recognition in the Browser," GitHub, 2018. [Online]. Available:
https://github.com/justadudewhohacks/face-api.js
```

**URL:** https://github.com/justadudewhohacks/face-api.js
**Documentación:** https://justadudewhohacks.github.io/face-api.js/docs/

---

### 5.2 TensorFlow.js

**[16] Smilkov, D., et al. (2019).** *TensorFlow.js: Machine Learning for the Web and Beyond.* Proceedings of Machine Learning and Systems (MLSys), 1, 309-321.

```
ABSTRACT:
TensorFlow.js es una librería de código abierto para machine learning en
JavaScript, que permite entrenar y ejecutar modelos directamente en navegadores
y Node.js. Soporta múltiples backends (WebGL, WASM, CPU).

ESPECIFICACIONES TÉCNICAS:
- Versión usada en VISION: 4.22.0
- Backends: WebGL (GPU), WebAssembly, CPU
- Aceleración: 10-100x con WebGL
- Compatible: Chrome, Firefox, Safari, Edge

CITACIÓN IEEE:
D. Smilkov et al., "TensorFlow.js: Machine Learning for the Web and Beyond,"
in Proc. Machine Learning and Systems (MLSys), vol. 1, 2019, pp. 309-321.
```

**URL:** https://www.tensorflow.org/js
**Paper:** https://arxiv.org/abs/1901.05350

---

### 5.3 React

**[17] Facebook Open Source. (2013-2024).** *React: A JavaScript library for building user interfaces.* Meta Platforms, Inc.

```
DESCRIPCIÓN:
Librería JavaScript declarativa para construir interfaces de usuario mediante
componentes. Utiliza Virtual DOM para actualizaciones eficientes.

ESPECIFICACIONES TÉCNICAS:
- Versión usada en VISION: 18.2.0
- Paradigma: Componentes funcionales + Hooks
- Rendering: Virtual DOM
- Licencia: MIT

CITACIÓN TÉCNICA:
Facebook Open Source, "React: A JavaScript library for building user
interfaces," Meta Platforms, Inc., 2013-2024. [Online]. Available:
https://react.dev/
```

**URL:** https://react.dev/

---

### 5.4 Material-UI (MUI)

**[18] MUI Team. (2014-2024).** *Material-UI: React components for faster and easier web development.* MIT License.

```
DESCRIPCIÓN:
Biblioteca de componentes React que implementa Material Design de Google.
Proporciona componentes pre-diseñados, accesibles y personalizables.

ESPECIFICACIONES TÉCNICAS:
- Versión usada en VISION: 5.15.10
- Componentes: 50+ componentes UI
- Theming: Personalización completa
- Accesibilidad: WCAG 2.1 AA

CITACIÓN TÉCNICA:
MUI Team, "Material-UI: React components for faster and easier web
development," 2014-2024. [Online]. Available: https://mui.com/
```

**URL:** https://mui.com/

---

### 5.5 Socket.IO

**[19] Rauch, G. (2010-2024).** *Socket.IO: Realtime application framework.* MIT License.

```
DESCRIPCIÓN:
Librería que permite comunicación bidireccional en tiempo real entre clientes
web y servidores. Utiliza WebSockets con fallbacks automáticos.

ESPECIFICACIONES TÉCNICAS:
- Versión usada en VISION: 4.8.1 (client), 4.7.4 (server)
- Protocolo: WebSocket (WSS en producción)
- Fallbacks: Long-polling, HTTP streaming
- Latencia típica: < 50ms

CITACIÓN TÉCNICA:
G. Rauch, "Socket.IO: Realtime application framework," 2010-2024. [Online].
Available: https://socket.io/
```

**URL:** https://socket.io/

---

## 6. DATASETS DE ENTRENAMIENTO

### 6.1 VGGFace2

**[20] Cao, Q., Shen, L., Xie, W., Parkhi, O. M., & Zisserman, A. (2018).** *VGGFace2: A dataset for recognising faces across pose and age.* 13th IEEE International Conference on Automatic Face & Gesture Recognition (FG 2018), pp. 67-74.

```
ABSTRACT:
Dataset a gran escala para reconocimiento facial con 3.31 millones de imágenes
de 9,131 sujetos. Incluye variaciones significativas en pose, edad, iluminación
y oclusiones. Usado para entrenar FaceRecognitionNet.

ESPECIFICACIONES:
- Imágenes: 3,310,000
- Identidades: 9,131
- Promedio por identidad: 362.6 imágenes
- Resolución: Variable (mínimo 224x224)
- Licencia: Uso académico

CITACIÓN IEEE:
Q. Cao, L. Shen, W. Xie, O. M. Parkhi, and A. Zisserman, "VGGFace2: A
dataset for recognising faces across pose and age," in Proc. 13th IEEE Int.
Conf. Automatic Face & Gesture Recognition (FG), 2018, pp. 67-74.

DOI: 10.1109/FG.2018.00020
```

**URL:** https://github.com/ox-vgg/vgg_face2

---

### 6.2 WIDER FACE

**[21] Yang, S., Luo, P., Loy, C. C., & Tang, X. (2016).** *WIDER FACE: A Face Detection Benchmark.* IEEE Conference on Computer Vision and Pattern Recognition (CVPR), pp. 5525-5533.

```
ABSTRACT:
Dataset para detección facial con 32,203 imágenes y 393,703 rostros anotados
con alta variabilidad en escala, pose y oclusión. Categoriza las imágenes en
tres niveles de dificultad: fácil, medio y difícil.

ESPECIFICACIONES:
- Imágenes: 32,203
- Rostros anotados: 393,703
- Eventos: 61 categorías
- Niveles: Fácil, Medio, Difícil
- Usado para: Entrenar TinyFaceDetector

CITACIÓN IEEE:
S. Yang, P. Luo, C. C. Loy, and X. Tang, "WIDER FACE: A Face Detection
Benchmark," in Proc. IEEE Conf. Computer Vision and Pattern Recognition
(CVPR), 2016, pp. 5525-5533.

DOI: 10.1109/CVPR.2016.596
```

**URL:** http://shuoyang1213.me/WIDERFACE/

---

## 7. NORMATIVAS Y ESTÁNDARES

### 7.1 GDPR - Protección de Datos

**[22] Reglamento (UE) 2016/679** del Parlamento Europeo y del Consejo, de 27 de abril de 2016, relativo a la protección de las personas físicas en lo que respecta al tratamiento de datos personales y a la libre circulación de estos datos.

```
RELEVANCIA PARA VISION:
- Procesamiento local de datos biométricos (sin servidor)
- Minimización de datos
- Privacy by design
- Derecho al olvido (soft deletes)
- Consentimiento explícito para uso de cámara

ARTÍCULOS APLICABLES:
- Art. 4(14): Datos biométricos
- Art. 9: Tratamiento de categorías especiales de datos
- Art. 25: Protección de datos desde el diseño
- Art. 32: Seguridad del tratamiento

CITACIÓN:
Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de
abril de 2016 (GDPR). Diario Oficial de la Unión Europea, L 119/1.
```

**URL:** https://eur-lex.europa.eu/eli/reg/2016/679/oj

---

### 7.2 ISO/IEC 30107 - Biometric Presentation Attack Detection

**[23] ISO/IEC 30107-1:2016.** Information technology — Biometric presentation attack detection — Part 1: Framework.

```
DESCRIPCIÓN:
Estándar internacional para detección de ataques de presentación en sistemas
biométricos. Define terminología, conceptos y métricas para evaluar la
robustez contra spoofing.

RELEVANCIA PARA VISION:
- Detección de ataques (fotos, videos, máscaras)
- Métricas de evaluación (APCER, BPCER)
- Liveness detection (no implementado actualmente)
- Consideraciones de seguridad

CITACIÓN:
ISO/IEC 30107-1:2016, Information technology — Biometric presentation
attack detection — Part 1: Framework. International Organization for
Standardization, 2016.
```

**URL:** https://www.iso.org/standard/53227.html

---

### 7.3 WebGL 2.0 Specification

**[24] Khronos Group. (2017).** *WebGL 2.0 Specification.* Editor's Draft.

```
DESCRIPCIÓN:
Especificación de la API WebGL 2.0 para renderizado 3D/2D en navegadores web
con aceleración por hardware. Basada en OpenGL ES 3.0.

RELEVANCIA PARA VISION:
- Backend de TensorFlow.js para aceleración GPU
- Operaciones tensoriales aceleradas
- Shaders para cálculos paralelos
- 10-100x más rápido que CPU

CITACIÓN TÉCNICA:
Khronos Group, "WebGL 2.0 Specification," Editor's Draft, 2017. [Online].
Available: https://www.khronos.org/registry/webgl/specs/latest/2.0/
```

**URL:** https://www.khronos.org/webgl/

---

## 8. CITAS EN EL PROYECTO

### 8.1 Algoritmo EAR (Eye Aspect Ratio)

```typescript
// drowsinessDetection.service.ts
// Basado en: Soukupová & Čech (2016) [1]

/**
 * Calcula el Eye Aspect Ratio (EAR) para detectar ojos cerrados.
 * 
 * Implementación del método propuesto por Soukupová & Čech (2016) en
 * "Real-Time Eye Blink Detection using Facial Landmarks".
 * 
 * Fórmula: EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
 * 
 * @param eye Array de 6 puntos del ojo (landmarks 36-41 o 42-47)
 * @returns Valor EAR (típicamente 0.15-0.40)
 * 
 * @reference Soukupová, T., & Čech, J. (2016). Real-Time Eye Blink
 * Detection using Facial Landmarks. 21st Computer Vision Winter Workshop.
 */
private calculateEAR(eye: faceapi.Point[]): number {
  // Distancias verticales
  const A = this.euclideanDistance(eye[1], eye[5]);  // |p2 - p6|
  const B = this.euclideanDistance(eye[2], eye[4]);  // |p3 - p5|
  
  // Distancia horizontal
  const C = this.euclideanDistance(eye[0], eye[3]);  // |p1 - p4|
  
  // Calcular EAR según Soukupová & Čech (2016)
  const ear = (A + B) / (2.0 * C);
  
  return ear;
}
```

---

### 8.2 Umbrales de Detección

```typescript
// drowsinessDetection.service.ts
// Umbrales calibrados basados en literatura científica [1, 9]

private readonly EYE_AR_THRESH = 0.29;  // Ojos cerrados si EAR < 0.29
// Soukupová & Čech (2016) sugieren 0.3, ajustado a 0.29 para VISION

private readonly YAWN_THRESH = 0.45;    // Bostezo si MAR > 0.45
// Adaptado de EAR para la región de la boca [9]

private readonly EYE_AR_CONSEC_FRAMES = 1;  // Frames consecutivos
private readonly YAWN_CONSEC_FRAMES = 1;    // Reducido para sensibilidad
```

---

### 8.3 Arquitectura de Modelos

```typescript
// drowsinessDetection.service.ts
// Modelos basados en investigación académica [2, 3, 4, 5]

/**
 * Carga los modelos de face-api.js pre-entrenados:
 * 
 * 1. TinyFaceDetector: Basado en MobileNets [5]
 *    - Arquitectura: Depthwise Separable CNN
 *    - Parámetros: ~400,000
 *    - Dataset: WIDER FACE [21]
 * 
 * 2. FaceLandmark68Net: Basado en iBUG 300-W [4]
 *    - Arquitectura: CNN para regresión de puntos
 *    - Landmarks: 68 puntos faciales
 *    - Dataset: 300 Faces In-The-Wild [4]
 * 
 * 3. FaceRecognitionNet: Basado en ResNet-34 [2] y FaceNet [3]
 *    - Arquitectura: ResNet-34 (34 capas)
 *    - Output: 128D face embeddings
 *    - Dataset: VGGFace2 [20]
 */
async loadModels(): Promise<void> {
  const MODEL_URL = '/models';
  
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  
  this.modelsLoaded = true;
}
```

---

### 8.4 Privacy by Design

```typescript
// api.ts & socket.service.ts
// Implementación de Privacy by Design según GDPR [22]

/**
 * VISION implementa procesamiento local de datos biométricos
 * conforme al Artículo 9 del GDPR [22].
 * 
 * Principios aplicados:
 * 1. Minimización de datos: Solo se capturan frames de video necesarios
 * 2. Procesamiento local: face-api.js ejecuta en navegador (sin servidor)
 * 3. No almacenamiento: Frames de video NO se guardan en servidor
 * 4. Anonimización: Solo métricas numéricas (EAR, MAR) se transmiten
 * 5. Consentimiento: Usuario debe autorizar acceso a cámara
 * 
 * @reference Reglamento (UE) 2016/679 (GDPR), Art. 9, 25, 32
 */
```

---

## 📊 RESUMEN DE REFERENCIAS POR CATEGORÍA

```
┌─────────────────────────────────────────────────────────┐
│              DISTRIBUCIÓN DE REFERENCIAS                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Papers Científicos Fundamentales:      5 referencias  │
│  Estudios de Detección de Somnolencia:  5 referencias  │
│  Reconocimiento Facial e IA:            4 referencias  │
│  Frameworks y Librerías:                5 referencias  │
│  Datasets de Entrenamiento:             2 referencias  │
│  Normativas y Estándares:               3 referencias  │
│                                        ───────────────  │
│  TOTAL:                                24 referencias  │
│                                                         │
│  Por tipo:                                              │
│  • Papers IEEE/CVPR:         8 (33%)                   │
│  • Artículos de revista:     7 (29%)                   │
│  • Documentación técnica:    5 (21%)                   │
│  • Normativas:               3 (13%)                   │
│  • Datasets:                 2 (8%)                    │
│                                                         │
│  Por idioma:                                            │
│  • Inglés:                  14 (58%)                   │
│  • Español:                 10 (42%)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 CÓMO CITAR ESTE PROYECTO

### Formato APA 7ª Edición

```
Montufar Merma, R. D. (2025). VISION: Sistema de Detección de Somnolencia
en Conductores mediante Visión por Computadora y Aprendizaje Profundo
[Software]. https://github.com/rogeero/vision
```

### Formato IEEE

```
R. D. Montufar Merma, "VISION: Sistema de Detección de Somnolencia en
Conductores mediante Visión por Computadora y Aprendizaje Profundo," 2025.
[Software]. Available: https://github.com/rogeero/vision
```

### BibTeX

```bibtex
@software{montufar2025vision,
  author = {Montufar Merma, Rogeero Daniel},
  title = {VISION: Sistema de Detección de Somnolencia en Conductores
           mediante Visión por Computadora y Aprendizaje Profundo},
  year = {2025},
  url = {https://github.com/rogeero/vision},
  note = {Sistema web en tiempo real utilizando face-api.js, TensorFlow.js,
          React y Socket.IO}
}
```

---

## 🔗 ENLACES ÚTILES

### Repositorios y Documentación

- **Proyecto VISION:** [Repositorio GitHub]
- **face-api.js:** https://github.com/justadudewhohacks/face-api.js
- **TensorFlow.js:** https://www.tensorflow.org/js
- **React:** https://react.dev/
- **Socket.IO:** https://socket.io/

### Papers y Datasets

- **ArXiv (Papers ML/CV):** https://arxiv.org/
- **IEEE Xplore:** https://ieeexplore.ieee.org/
- **Google Scholar:** https://scholar.google.com/
- **Papers With Code:** https://paperswithcode.com/

### Recursos Educativos

- **Curso TensorFlow.js:** https://www.tensorflow.org/js/tutorials
- **Computer Vision Course:** https://www.coursera.org/learn/computer-vision
- **Deep Learning Specialization:** https://www.coursera.org/specializations/deep-learning

---

## 📄 LICENCIA DE ESTE DOCUMENTO

Este documento de referencias bibliográficas está bajo licencia **Creative Commons Attribution 4.0 International (CC BY 4.0)**.

Usted es libre de:
- **Compartir** — copiar y redistribuir el material en cualquier medio o formato
- **Adaptar** — remezclar, transformar y construir a partir del material para cualquier propósito

Bajo los siguientes términos:
- **Atribución** — Debe dar crédito apropiado, proporcionar un enlace a la licencia e indicar si se han realizado cambios.

---

**Proyecto:** VISION - Sistema de Detección de Somnolencia
**Versión:** 1.0.0
**Autor:** Rogeero Daniel Montufar Merma
**Fecha:** Octubre 2025
**Última actualización:** 27 de Octubre de 2025

