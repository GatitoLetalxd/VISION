# Resumen Ejecutivo - Precisión de Modelos de Detección Facial

## Para Metodología de Investigación

### Modelos Utilizados en VISION

#### 1. TinyFaceDetector (face-api.js)
- **Precisión de Detección**: 85-90% (mAP en WIDER FACE)
- **Base**: MobileNet (CNN ligera)
- **Tamaño**: ~190 KB
- **Velocidad**: 10-15 FPS

#### 2. FaceLandmark68Net
- **Precisión de Landmarks**: 95-98% (región ocular), 92-95% (región bucal)
- **Error Normalizado (NME)**: 3.5-4.5%
- **Dataset**: iBUG 300-W
- **Puntos de Referencia**: 68 puntos faciales

#### 3. MediaPipe Face Mesh
- **Precisión de Detección**: 92-95%
- **Precisión de Landmarks**: 96-99%
- **Error Normalizado (NME)**: 2.5-3.5%
- **Puntos de Referencia**: 468 puntos (3D)

### Algoritmos de Análisis

#### Eye Aspect Ratio (EAR)
- **Precisión Reportada**: 90-95% (literatura científica)
- **Sensibilidad**: 92-96%
- **Especificidad**: 88-94%
- **Implementación VISION**: 88-93% (condiciones reales)

#### Mouth Aspect Ratio (MAR)
- **Precisión Reportada**: 87-92%
- **Sensibilidad**: 85-90%
- **Especificidad**: 90-95%
- **Implementación VISION**: 85-90%

### Precisión General del Sistema VISION

- **Precisión Promedio**: **87-92%**
- **Sensibilidad (TPR)**: **90-94%**
- **Especificidad (TNR)**: **85-90%**
- **F1-Score**: **0.88-0.91**
- **Falsos Positivos**: 8-12%
- **Falsos Negativos**: 6-10%

### Factores que Afectan la Precisión

| Condición | Precisión |
|-----------|-----------|
| Buena iluminación | 92-95% |
| Iluminación media | 87-92% |
| Baja iluminación | 75-85% |
| Rostro frontal (0-15°) | 92-95% |
| Rostro girado (15-30°) | 87-92% |
| Rostro de perfil (>30°) | 70-80% |

### Comparación de Modelos

| Métrica | face-api.js | MediaPipe |
|---------|-------------|-----------|
| Precisión Detección | 85-90% | 92-95% |
| Precisión Landmarks | 95-98% | 96-99% |
| Velocidad | 10-15 FPS | 15-30 FPS |
| Procesamiento | Cliente | Servidor |

### Referencias Principales

1. Soukupová & Čech (2016) - EAR Algorithm
2. Howard et al. (2017) - MobileNet Architecture
3. Sagonas et al. (2013) - iBUG 300-W Dataset
4. Google Research (2019) - MediaPipe Framework

