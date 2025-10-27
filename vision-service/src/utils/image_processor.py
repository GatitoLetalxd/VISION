"""
Utilidades para procesamiento de imágenes
Maneja captura, procesamiento y almacenamiento de imágenes
"""

import cv2
import numpy as np
from PIL import Image
import os
from datetime import datetime
from typing import Optional, Tuple, List
from pathlib import Path
import base64
import io

from ..config.settings import settings

class ImageProcessor:
    """Procesador de imágenes para el servicio de visión"""
    
    def __init__(self):
        self.images_dir = Path(settings.images_dir)
        self.images_dir.mkdir(parents=True, exist_ok=True)
        
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocesar imagen para detección
        
        Args:
            image: Imagen de entrada
            
        Returns:
            Imagen preprocesada
        """
        # Redimensionar si es necesario
        height, width = image.shape[:2]
        max_size = settings.max_image_size
        
        if height * width > max_size:
            scale = np.sqrt(max_size / (height * width))
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height))
        
        # Aplicar filtros de mejora
        image = self._enhance_image(image)
        
        return image
    
    def _enhance_image(self, image: np.ndarray) -> np.ndarray:
        """Mejorar calidad de la imagen"""
        # Convertir a LAB para mejor procesamiento
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Aplicar CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        # Reconstruir imagen
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        # Reducir ruido
        enhanced = cv2.bilateralFilter(enhanced, 9, 75, 75)
        
        return enhanced
    
    def save_image(self, image: np.ndarray, filename: Optional[str] = None) -> str:
        """
        Guardar imagen en disco
        
        Args:
            image: Imagen a guardar
            filename: Nombre del archivo (opcional)
            
        Returns:
            Ruta del archivo guardado
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
            filename = f"detection_{timestamp}.jpg"
        
        filepath = self.images_dir / filename
        
        # Codificar imagen con calidad especificada
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), settings.image_quality]
        success, encoded_img = cv2.imencode('.jpg', image, encode_param)
        
        if success:
            with open(filepath, 'wb') as f:
                f.write(encoded_img.tobytes())
            return str(filepath)
        else:
            raise ValueError("Error al codificar imagen")
    
    def draw_detection_overlay(
        self, 
        image: np.ndarray, 
        detection_result, 
        show_landmarks: bool = True,
        show_metrics: bool = True
    ) -> np.ndarray:
        """
        Dibujar overlay de detección en la imagen
        
        Args:
            image: Imagen original
            detection_result: Resultado de la detección
            show_landmarks: Mostrar landmarks faciales
            show_metrics: Mostrar métricas
            
        Returns:
            Imagen con overlay
        """
        overlay = image.copy()
        
        # Dibujar bounding box
        if detection_result.bounding_box:
            x, y, w, h = detection_result.bounding_box
            color = self._get_severity_color(detection_result.severity.value)
            cv2.rectangle(overlay, (x, y), (x + w, y + h), color, 2)
        
        # Dibujar landmarks
        if show_landmarks and detection_result.landmarks:
            for point in detection_result.landmarks:
                cv2.circle(overlay, point, 2, (0, 255, 0), -1)
        
        # Dibujar información de texto
        if show_metrics:
            self._draw_metrics_text(overlay, detection_result)
        
        return overlay
    
    def _get_severity_color(self, severity: str) -> Tuple[int, int, int]:
        """Obtener color según severidad"""
        colors = {
            "low": (0, 255, 0),      # Verde
            "medium": (0, 255, 255), # Amarillo
            "high": (0, 165, 255),   # Naranja
            "critical": (0, 0, 255)  # Rojo
        }
        return colors.get(severity, (255, 255, 255))
    
    def _draw_metrics_text(self, image: np.ndarray, detection_result) -> None:
        """Dibujar métricas en la imagen"""
        y_offset = 30
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.7
        thickness = 2
        
        # Información del evento
        event_text = f"Event: {detection_result.event_type.value}"
        severity_text = f"Severity: {detection_result.severity.value}"
        confidence_text = f"Confidence: {detection_result.confidence:.2f}"
        
        # Métricas técnicas
        ear_text = f"EAR: {detection_result.ear:.3f}"
        mar_text = f"MAR: {detection_result.mar:.3f}"
        angle_text = f"Angle: {detection_result.head_angle:.1f}°"
        
        texts = [
            event_text,
            severity_text,
            confidence_text,
            ear_text,
            mar_text,
            angle_text
        ]
        
        for i, text in enumerate(texts):
            y = y_offset + (i * 25)
            color = self._get_severity_color(detection_result.severity.value)
            cv2.putText(image, text, (10, y), font, font_scale, color, thickness)
    
    def encode_image_to_base64(self, image: np.ndarray) -> str:
        """
        Codificar imagen a base64
        
        Args:
            image: Imagen a codificar
            
        Returns:
            String base64 de la imagen
        """
        # Codificar imagen
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), settings.image_quality]
        success, encoded_img = cv2.imencode('.jpg', image, encode_param)
        
        if success:
            # Convertir a base64
            img_base64 = base64.b64encode(encoded_img.tobytes()).decode('utf-8')
            return img_base64
        else:
            raise ValueError("Error al codificar imagen")
    
    def decode_base64_to_image(self, base64_string: str) -> np.ndarray:
        """
        Decodificar imagen desde base64
        
        Args:
            base64_string: String base64 de la imagen
            
        Returns:
            Imagen decodificada
        """
        try:
            # Decodificar base64
            img_data = base64.b64decode(base64_string)
            
            # Convertir a array numpy
            nparr = np.frombuffer(img_data, np.uint8)
            
            # Decodificar imagen
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Error al decodificar imagen")
            
            return image
        except Exception as e:
            raise ValueError(f"Error al decodificar imagen: {e}")
    
    def create_thumbnail(self, image: np.ndarray, size: Tuple[int, int] = (150, 150)) -> np.ndarray:
        """
        Crear miniatura de la imagen
        
        Args:
            image: Imagen original
            size: Tamaño de la miniatura
            
        Returns:
            Miniatura de la imagen
        """
        return cv2.resize(image, size)
    
    def extract_face_region(self, image: np.ndarray, bounding_box: Tuple[int, int, int, int]) -> np.ndarray:
        """
        Extraer región de la cara
        
        Args:
            image: Imagen original
            bounding_box: Bounding box de la cara
            
        Returns:
            Región de la cara extraída
        """
        x, y, w, h = bounding_box
        
        # Asegurar que las coordenadas estén dentro de la imagen
        x = max(0, x)
        y = max(0, y)
        w = min(w, image.shape[1] - x)
        h = min(h, image.shape[0] - y)
        
        return image[y:y+h, x:x+w]
    
    def cleanup_old_images(self, max_age_hours: int = 24) -> int:
        """
        Limpiar imágenes antiguas
        
        Args:
            max_age_hours: Edad máxima en horas
            
        Returns:
            Número de archivos eliminados
        """
        deleted_count = 0
        current_time = datetime.now()
        
        for file_path in self.images_dir.glob("*.jpg"):
            try:
                # Obtener tiempo de modificación
                file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
                
                # Calcular diferencia en horas
                age_hours = (current_time - file_time).total_seconds() / 3600
                
                if age_hours > max_age_hours:
                    file_path.unlink()
                    deleted_count += 1
                    
            except Exception as e:
                print(f"Error al eliminar archivo {file_path}: {e}")
        
        return deleted_count
