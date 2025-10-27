"""
Configuración del microservicio de visión
Maneja variables de entorno y configuración de la aplicación
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

# Directorio base del proyecto
BASE_DIR = Path(__file__).parent.parent.parent

class Settings(BaseSettings):
    """Configuración de la aplicación"""
    
    # Configuración del servidor
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    # Configuración de la API
    api_title: str = "Sistema de Alerta - Servicio de Visión"
    api_version: str = "1.0.0"
    api_description: str = "Microservicio para detección de somnolencia en conductores"
    
    # Configuración del backend
    backend_url: str = "http://localhost:3000"
    backend_api_key: str = "vision_api_key_123"
    
    # Configuración de MediaPipe
    mediapipe_model_path: str = str(BASE_DIR / "models" / "face_landmarker.task")
    mediapipe_num_faces: int = 1
    mediapipe_min_detection_confidence: float = 0.5
    mediapipe_min_tracking_confidence: float = 0.5
    
    # Configuración de detección
    eye_ar_threshold: float = 0.25  # Eye Aspect Ratio threshold
    mar_threshold: float = 0.5      # Mouth Aspect Ratio threshold
    ear_consecutive_frames: int = 3  # Frames consecutivos para detectar ojos cerrados
    mar_consecutive_frames: int = 3   # Frames consecutivos para detectar bostezo
    
    # Configuración de alertas
    drowsiness_threshold: float = 0.7
    critical_threshold: float = 0.9
    
    # Configuración de logging
    log_level: str = "INFO"
    log_file: str = str(BASE_DIR / "logs" / "vision_service.log")
    
    # Configuración de almacenamiento
    data_dir: str = str(BASE_DIR / "data")
    images_dir: str = str(BASE_DIR / "data" / "images")
    models_dir: str = str(BASE_DIR / "models")
    
    # Configuración de procesamiento
    max_image_size: int = 1920 * 1080  # Máximo tamaño de imagen
    image_quality: int = 85  # Calidad de compresión JPEG
    
    # Configuración de seguridad
    api_key_header: str = "X-Vision-API-Key"
    rate_limit_per_minute: int = 60
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Crear instancia de configuración
settings = Settings()

# Crear directorios necesarios
os.makedirs(settings.data_dir, exist_ok=True)
os.makedirs(settings.images_dir, exist_ok=True)
os.makedirs(settings.models_dir, exist_ok=True)
os.makedirs(os.path.dirname(settings.log_file), exist_ok=True)
