"""
Modelo de detección de somnolencia
Utiliza MediaPipe y OpenCV para detectar signos de fatiga en conductores
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import math

class EventType(Enum):
    """Tipos de eventos de somnolencia"""
    NORMAL = "normal"
    EYE_CLOSED = "eye_closed"
    HEAD_NODDING = "head_nodding"
    YAWNING = "yawning"
    BLINKING_SLOW = "blinking_slow"
    DISTRACTION = "distraction"

class Severity(Enum):
    """Niveles de severidad"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class DetectionResult:
    """Resultado de la detección"""
    event_type: EventType
    severity: Severity
    confidence: float
    ear: float  # Eye Aspect Ratio
    mar: float  # Mouth Aspect Ratio
    head_angle: float
    landmarks: Optional[List[Tuple[int, int]]] = None
    bounding_box: Optional[Tuple[int, int, int, int]] = None

class DrowsinessDetector:
    """Detector de somnolencia basado en MediaPipe"""
    
    def __init__(self, settings):
        self.settings = settings
        
        # Inicializar MediaPipe
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Configurar Face Mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=settings.mediapipe_num_faces,
            refine_landmarks=True,
            min_detection_confidence=settings.mediapipe_min_detection_confidence,
            min_tracking_confidence=settings.mediapipe_min_tracking_confidence
        )
        
        # Índices de landmarks para ojos y boca
        self.LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
        self.RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
        self.MOUTH_INDICES = [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318]
        
        # Historial de detecciones
        self.ear_history = []
        self.mar_history = []
        self.head_angle_history = []
        
        # Estados de detección
        self.eye_closed_frames = 0
        self.yawning_frames = 0
        self.distraction_frames = 0
        
    def calculate_ear(self, landmarks: List[Tuple[int, int]]) -> float:
        """Calcular Eye Aspect Ratio (EAR)"""
        # Obtener coordenadas de los ojos
        left_eye_points = [landmarks[i] for i in self.LEFT_EYE_INDICES]
        right_eye_points = [landmarks[i] for i in self.RIGHT_EYE_INDICES]
        
        # Calcular EAR para ojo izquierdo
        left_ear = self._calculate_eye_ratio(left_eye_points)
        
        # Calcular EAR para ojo derecho
        right_ear = self._calculate_eye_ratio(right_eye_points)
        
        # EAR promedio
        return (left_ear + right_ear) / 2.0
    
    def _calculate_eye_ratio(self, eye_points: List[Tuple[int, int]]) -> float:
        """Calcular ratio de aspecto del ojo"""
        if len(eye_points) < 6:
            return 0.0
            
        # Distancias verticales
        vertical_1 = self._euclidean_distance(eye_points[1], eye_points[5])
        vertical_2 = self._euclidean_distance(eye_points[2], eye_points[4])
        
        # Distancia horizontal
        horizontal = self._euclidean_distance(eye_points[0], eye_points[3])
        
        if horizontal == 0:
            return 0.0
            
        return (vertical_1 + vertical_2) / (2.0 * horizontal)
    
    def calculate_mar(self, landmarks: List[Tuple[int, int]]) -> float:
        """Calcular Mouth Aspect Ratio (MAR)"""
        mouth_points = [landmarks[i] for i in self.MOUTH_INDICES]
        
        if len(mouth_points) < 6:
            return 0.0
            
        # Distancias verticales
        vertical_1 = self._euclidean_distance(mouth_points[2], mouth_points[10])
        vertical_2 = self._euclidean_distance(mouth_points[4], mouth_points[8])
        
        # Distancia horizontal
        horizontal = self._euclidean_distance(mouth_points[0], mouth_points[6])
        
        if horizontal == 0:
            return 0.0
            
        return (vertical_1 + vertical_2) / (2.0 * horizontal)
    
    def calculate_head_angle(self, landmarks: List[Tuple[int, int]]) -> float:
        """Calcular ángulo de inclinación de la cabeza"""
        # Puntos clave para calcular el ángulo
        nose_tip = landmarks[1]  # Punta de la nariz
        left_eye = landmarks[33]
        right_eye = landmarks[362]
        
        # Calcular centro entre los ojos
        eye_center = (
            (left_eye[0] + right_eye[0]) // 2,
            (left_eye[1] + right_eye[1]) // 2
        )
        
        # Calcular ángulo
        dx = nose_tip[0] - eye_center[0]
        dy = nose_tip[1] - eye_center[1]
        
        angle = math.degrees(math.atan2(dy, dx))
        
        # Normalizar ángulo entre -90 y 90
        if angle > 90:
            angle -= 180
        elif angle < -90:
            angle += 180
            
        return angle
    
    def _euclidean_distance(self, point1: Tuple[int, int], point2: Tuple[int, int]) -> float:
        """Calcular distancia euclidiana entre dos puntos"""
        return math.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)
    
    def detect_drowsiness(self, image: np.ndarray) -> Optional[DetectionResult]:
        """Detectar signos de somnolencia en la imagen"""
        try:
            # Convertir imagen a RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Procesar con MediaPipe
            results = self.face_mesh.process(rgb_image)
            
            if not results.multi_face_landmarks:
                return None
            
            # Obtener landmarks de la primera cara detectada
            face_landmarks = results.multi_face_landmarks[0]
            
            # Convertir landmarks a coordenadas de píxeles
            h, w, _ = image.shape
            landmarks = []
            for landmark in face_landmarks.landmark:
                x = int(landmark.x * w)
                y = int(landmark.y * h)
                landmarks.append((x, y))
            
            # Calcular métricas
            ear = self.calculate_ear(landmarks)
            mar = self.calculate_mar(landmarks)
            head_angle = self.calculate_head_angle(landmarks)
            
            # Actualizar historial
            self.ear_history.append(ear)
            self.mar_history.append(mar)
            self.head_angle_history.append(head_angle)
            
            # Mantener solo los últimos N frames
            max_history = 30
            if len(self.ear_history) > max_history:
                self.ear_history.pop(0)
                self.mar_history.pop(0)
                self.head_angle_history.pop(0)
            
            # Detectar eventos
            event_type, severity, confidence = self._analyze_metrics(ear, mar, head_angle)
            
            # Calcular bounding box
            bounding_box = self._calculate_bounding_box(landmarks)
            
            return DetectionResult(
                event_type=event_type,
                severity=severity,
                confidence=confidence,
                ear=ear,
                mar=mar,
                head_angle=head_angle,
                landmarks=landmarks,
                bounding_box=bounding_box
            )
            
        except Exception as e:
            print(f"Error en detección: {e}")
            return None
    
    def _analyze_metrics(self, ear: float, mar: float, head_angle: float) -> Tuple[EventType, Severity, float]:
        """Analizar métricas para determinar tipo de evento y severidad"""
        
        # Detectar ojos cerrados
        if ear < self.settings.eye_ar_threshold:
            self.eye_closed_frames += 1
            if self.eye_closed_frames >= self.settings.ear_consecutive_frames:
                confidence = min(1.0, (self.settings.eye_ar_threshold - ear) / self.settings.eye_ar_threshold + 0.5)
                if confidence > self.settings.critical_threshold:
                    return EventType.EYE_CLOSED, Severity.CRITICAL, confidence
                elif confidence > self.settings.drowsiness_threshold:
                    return EventType.EYE_CLOSED, Severity.HIGH, confidence
                else:
                    return EventType.EYE_CLOSED, Severity.MEDIUM, confidence
        else:
            self.eye_closed_frames = 0
        
        # Detectar bostezo
        if mar > self.settings.mar_threshold:
            self.yawning_frames += 1
            if self.yawning_frames >= self.settings.mar_consecutive_frames:
                confidence = min(1.0, (mar - self.settings.mar_threshold) / self.settings.mar_threshold + 0.5)
                return EventType.YAWNING, Severity.MEDIUM, confidence
        else:
            self.yawning_frames = 0
        
        # Detectar inclinación de cabeza
        if abs(head_angle) > 30:  # Más de 30 grados de inclinación
            confidence = min(1.0, abs(head_angle) / 90.0)
            if confidence > self.settings.critical_threshold:
                return EventType.HEAD_NODDING, Severity.CRITICAL, confidence
            elif confidence > self.settings.drowsiness_threshold:
                return EventType.HEAD_NODDING, Severity.HIGH, confidence
            else:
                return EventType.HEAD_NODDING, Severity.MEDIUM, confidence
        
        # Detectar parpadeo lento (EAR variable)
        if len(self.ear_history) >= 5:
            ear_variance = np.var(self.ear_history[-5:])
            if ear_variance > 0.01:  # Variabilidad alta en EAR
                confidence = min(1.0, ear_variance * 10)
                return EventType.BLINKING_SLOW, Severity.LOW, confidence
        
        # Estado normal
        return EventType.NORMAL, Severity.LOW, 0.5
    
    def _calculate_bounding_box(self, landmarks: List[Tuple[int, int]]) -> Tuple[int, int, int, int]:
        """Calcular bounding box de la cara"""
        if not landmarks:
            return (0, 0, 0, 0)
        
        x_coords = [point[0] for point in landmarks]
        y_coords = [point[1] for point in landmarks]
        
        x_min = min(x_coords)
        y_min = min(y_coords)
        x_max = max(x_coords)
        y_max = max(y_coords)
        
        return (x_min, y_min, x_max - x_min, y_max - y_min)
    
    def get_statistics(self) -> Dict:
        """Obtener estadísticas del detector"""
        return {
            "ear_history_length": len(self.ear_history),
            "mar_history_length": len(self.mar_history),
            "head_angle_history_length": len(self.head_angle_history),
            "eye_closed_frames": self.eye_closed_frames,
            "yawning_frames": self.yawning_frames,
            "distraction_frames": self.distraction_frames,
            "avg_ear": np.mean(self.ear_history) if self.ear_history else 0,
            "avg_mar": np.mean(self.mar_history) if self.mar_history else 0,
            "avg_head_angle": np.mean(self.head_angle_history) if self.head_angle_history else 0
        }
    
    def reset(self):
        """Reiniciar el detector"""
        self.ear_history.clear()
        self.mar_history.clear()
        self.head_angle_history.clear()
        self.eye_closed_frames = 0
        self.yawning_frames = 0
        self.distraction_frames = 0
