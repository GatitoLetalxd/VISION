import * as faceapi from 'face-api.js';

export interface EyeAspectRatio {
  left: number;
  right: number;
  average: number;
}

export interface MouthAspectRatio {
  ratio: number;
}

export interface DrowsinessMetrics {
  eyesClosed: boolean;
  yawning: boolean;
  drowsinessLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  ear: EyeAspectRatio;
  mar: MouthAspectRatio;
  confidence: number;
}

class DrowsinessDetectionService {
  private modelsLoaded = false;
  private eyeClosedFrames = 0;
  private yawnFrames = 0;
  // Umbrales ajustados para mejor detección
  private readonly EYE_AR_THRESH = 0.29; // Umbral para detectar ojos cerrados
  private readonly EYE_AR_RELATIVE_THRESH = 0.20; // Umbral relativo: si EAR baja más del 20% del valor normal
  private readonly YAWN_THRESH = 0.45;   // Umbral para detectar bostezo
  private readonly EYE_AR_CONSEC_FRAMES = 2; // 2 frames para confirmar (reduce falsos positivos)
  private readonly YAWN_CONSEC_FRAMES = 1;   // Solo 1 frame para confirmar (detección más rápida de bostezos)
  private frameCount = 0;
  private debugMode = false; // Modo debug desactivado para mejor rendimiento
  private lastDetectionTime = 0;
  private readonly DETECTION_INTERVAL = 100; // Detectar cada 100ms (10 FPS) en lugar de cada frame
  // Promedio móvil para EAR normal (para detección relativa)
  private earHistory: number[] = [];
  private readonly EAR_HISTORY_SIZE = 10; // Mantener últimos 10 valores
  private baselineEAR: number | null = null; // EAR normal del usuario

  async loadModels(): Promise<void> {
    if (this.modelsLoaded) {
      console.log('✅ Modelos ya estaban cargados');
      return;
    }

    try {
      const MODEL_URL = '/models';
      
      console.log('🔄 Cargando modelos de detección facial desde:', MODEL_URL);
      console.log('🔄 Cargando TinyFaceDetector...');
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      console.log('✅ TinyFaceDetector cargado');
      
      console.log('🔄 Cargando FaceLandmark68Net...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log('✅ FaceLandmark68Net cargado');
      
      console.log('🔄 Cargando FaceRecognitionNet...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      console.log('✅ FaceRecognitionNet cargado');

      this.modelsLoaded = true;
      console.log('✅✅✅ TODOS LOS MODELOS CARGADOS CORRECTAMENTE');
    } catch (error) {
      console.error('❌ Error al cargar modelos:', error);
      throw new Error('No se pudieron cargar los modelos de detección: ' + (error as Error).message);
    }
  }

  /**
   * Calcula el Eye Aspect Ratio (EAR) para detectar ojos cerrados
   */
  private calculateEAR(eye: faceapi.Point[]): number {
    // Distancias verticales
    const A = this.euclideanDistance(eye[1], eye[5]);
    const B = this.euclideanDistance(eye[2], eye[4]);
    
    // Distancia horizontal
    const C = this.euclideanDistance(eye[0], eye[3]);
    
    // EAR = (A + B) / (2.0 * C)
    const ear = (A + B) / (2.0 * C);
    return ear;
  }

  /**
   * Calcula el Mouth Aspect Ratio (MAR) para detectar bostezos
   */
  private calculateMAR(mouth: faceapi.Point[]): number {
    // Distancias verticales de la boca
    const A = this.euclideanDistance(mouth[13], mouth[19]); // Centro superior-inferior
    const B = this.euclideanDistance(mouth[14], mouth[18]); // Lados
    const C = this.euclideanDistance(mouth[15], mouth[17]); // Lados
    
    // Distancia horizontal
    const D = this.euclideanDistance(mouth[12], mouth[16]); // Ancho de la boca
    
    // MAR = (A + B + C) / (2.0 * D)
    const mar = (A + B + C) / (2.0 * D);
    return mar;
  }

  /**
   * Calcula la distancia euclidiana entre dos puntos
   */
  private euclideanDistance(point1: faceapi.Point, point2: faceapi.Point): number {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
    );
  }


  /**
   * Detecta signos de somnolencia en un frame de video
   */
  async detectDrowsiness(
    video: HTMLVideoElement,
    canvas?: HTMLCanvasElement
  ): Promise<DrowsinessMetrics | null> {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    // Throttle: solo detectar cada DETECTION_INTERVAL ms
    const now = Date.now();
    if (now - this.lastDetectionTime < this.DETECTION_INTERVAL) {
      return null; // Saltar este frame
    }
    this.lastDetectionTime = now;

    try {
      // Detectar cara y landmarks con opciones optimizadas
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
          inputSize: 224, // Reducido de 416 para mayor velocidad
          scoreThreshold: 0.5 // Umbral de confianza
        }))
        .withFaceLandmarks();

      if (!detections) {
        return null;
      }

      // Obtener landmarks de los ojos y boca
      const landmarks = detections.landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const mouth = landmarks.getMouth();

      // Calcular EAR (Eye Aspect Ratio)
      const leftEAR = this.calculateEAR(leftEye);
      const rightEAR = this.calculateEAR(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2.0;

      // Actualizar historial de EAR para calcular baseline
      this.earHistory.push(avgEAR);
      if (this.earHistory.length > this.EAR_HISTORY_SIZE) {
        this.earHistory.shift();
      }
      
      // Calcular EAR baseline (promedio de los últimos valores cuando los ojos están abiertos)
      if (this.earHistory.length >= 5) {
        const sortedEAR = [...this.earHistory].sort((a, b) => b - a);
        // Usar el promedio de los valores más altos (ojos abiertos)
        this.baselineEAR = sortedEAR.slice(0, Math.floor(this.earHistory.length * 0.6)).reduce((a, b) => a + b, 0) / Math.floor(this.earHistory.length * 0.6);
      }

      // Calcular MAR (Mouth Aspect Ratio)
      const mar = this.calculateMAR(mouth);

      // Debug: Mostrar valores cada 30 frames
      this.frameCount++;
      if (this.debugMode && this.frameCount % 30 === 0) {
        console.log('📊 DEBUG Detección:', {
          EAR: avgEAR.toFixed(3),
          'EAR Baseline': this.baselineEAR?.toFixed(3) || 'N/A',
          'EAR Umbral Absoluto': this.EYE_AR_THRESH,
          'EAR Umbral Relativo': this.baselineEAR ? (this.baselineEAR * (1 - this.EYE_AR_RELATIVE_THRESH)).toFixed(3) : 'N/A',
          'Ojos cerrados?': avgEAR < this.EYE_AR_THRESH || (this.baselineEAR && avgEAR < this.baselineEAR * (1 - this.EYE_AR_RELATIVE_THRESH)),
          'Frames ojos cerrados': this.eyeClosedFrames,
          MAR: mar.toFixed(3),
          'MAR Umbral': this.YAWN_THRESH,
          'Bostezando?': mar > this.YAWN_THRESH,
          'Frames bostezo': this.yawnFrames,
        });
      }

      // Detectar ojos cerrados usando umbral absoluto Y relativo
      let eyesClosed = false;
      const absoluteThreshold = avgEAR < this.EYE_AR_THRESH;
      const relativeThreshold = this.baselineEAR !== null && avgEAR < (this.baselineEAR * (1 - this.EYE_AR_RELATIVE_THRESH));
      
      if (absoluteThreshold || relativeThreshold) {
        this.eyeClosedFrames += 1;
        if (this.eyeClosedFrames >= this.EYE_AR_CONSEC_FRAMES) {
          eyesClosed = true;
          console.log('😴 OJOS CERRADOS DETECTADOS! EAR:', avgEAR.toFixed(3), 'Baseline:', this.baselineEAR?.toFixed(3) || 'N/A', 'Frames:', this.eyeClosedFrames);
        }
      } else {
        this.eyeClosedFrames = 0;
      }

      // Detectar bostezo
      let yawning = false;
      if (mar > this.YAWN_THRESH) {
        this.yawnFrames += 1;
        if (this.yawnFrames >= this.YAWN_CONSEC_FRAMES) {
          yawning = true;
          console.log('🥱 BOSTEZO DETECTADO! MAR:', mar.toFixed(3), 'Frames:', this.yawnFrames);
        }
      } else {
        this.yawnFrames = 0;
      }

      // Calcular nivel de somnolencia
      let drowsinessLevel: DrowsinessMetrics['drowsinessLevel'] = 'none';
      
      if (eyesClosed && yawning) {
        drowsinessLevel = 'critical';
      } else if (eyesClosed && this.eyeClosedFrames > 10) {
        drowsinessLevel = 'high';
      } else if (yawning) {
        drowsinessLevel = 'medium';
      } else if (eyesClosed) {
        drowsinessLevel = 'low';
      }

      // Dibujar en canvas si se proporciona
      if (canvas) {
        const displaySize = {
          width: video.videoWidth,
          height: video.videoHeight,
        };
        faceapi.matchDimensions(canvas, displaySize);

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Limpiar canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // SIEMPRE dibujar el cuadro alrededor del rostro
          const box = resizedDetections.detection.box;
          
          // Determinar color según nivel de somnolencia
          let boxColor = '#4caf50'; // Verde por defecto (normal)
          if (drowsinessLevel === 'critical') boxColor = '#ff1744';
          else if (drowsinessLevel === 'high') boxColor = '#ff5252';
          else if (drowsinessLevel === 'medium') boxColor = '#ffa726';
          else if (drowsinessLevel === 'low') boxColor = '#ffeb3b';
          
          // Dibujar rectángulo alrededor del rostro
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 4;
          ctx.shadowColor = boxColor;
          ctx.shadowBlur = 15;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          ctx.shadowBlur = 0;
          
          // Dibujar etiqueta en la parte superior del cuadro
          ctx.fillStyle = boxColor;
          ctx.fillRect(box.x, box.y - 30, 150, 30);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 14px Arial';
          ctx.fillText(`👤 ${drowsinessLevel.toUpperCase()}`, box.x + 5, box.y - 10);
          
          // Dibujar landmarks de ojos y boca con mejor visibilidad
          const landmarkColor = eyesClosed ? '#ff1744' : '#00d4ff';
          
          // Configurar color y grosor de línea antes de dibujar
          ctx.strokeStyle = landmarkColor;
          ctx.fillStyle = landmarkColor;
          ctx.lineWidth = eyesClosed ? 4 : 3;
          
          // Dibujar landmarks
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          
          // Mostrar EAR promedio debajo del rostro
          ctx.fillStyle = eyesClosed ? '#ff1744' : '#00d4ff';
          ctx.font = 'bold 16px Arial';
          ctx.fillText(`EAR: ${avgEAR.toFixed(3)}`, box.x, box.y + box.height + 25);
          
          // Mostrar umbral como referencia
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '12px Arial';
          ctx.fillText(`Umbral: ${this.EYE_AR_THRESH}`, box.x, box.y + box.height + 45);
        }
      }

      return {
        eyesClosed,
        yawning,
        drowsinessLevel,
        ear: {
          left: leftEAR,
          right: rightEAR,
          average: avgEAR,
        },
        mar: {
          ratio: mar,
        },
        confidence: detections.detection.score,
      };
    } catch (error) {
      console.error('Error en detección:', error);
      return null;
    }
  }

  /**
   * Reinicia los contadores de frames
   */
  reset(): void {
    this.eyeClosedFrames = 0;
    this.yawnFrames = 0;
    this.earHistory = [];
    this.baselineEAR = null;
  }

  /**
   * Verifica si los modelos están cargados
   */
  isReady(): boolean {
    return this.modelsLoaded;
  }

  /**
   * Obtiene los umbrales actuales
   */
  getThresholds() {
    return {
      eyeAR: this.EYE_AR_THRESH,
      yawn: this.YAWN_THRESH,
      eyeFrames: this.EYE_AR_CONSEC_FRAMES,
      yawnFrames: this.YAWN_CONSEC_FRAMES,
    };
  }

  /**
   * Establece el modo debug
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}

export const drowsinessDetectionService = new DrowsinessDetectionService();

