"""
Aplicación principal del microservicio de visión
FastAPI para detección de somnolencia en conductores
"""

import asyncio
import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import base64
from datetime import datetime
import uvicorn

# Importar módulos locales
from src.config.settings import settings
from src.models.drowsiness_detector import DrowsinessDetector, DetectionResult
from src.services.backend_client import BackendClient
from src.utils.image_processor import ImageProcessor

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar componentes
detector = DrowsinessDetector(settings)
backend_client = BackendClient()
image_processor = ImageProcessor()

# Modelos Pydantic para validación
class DetectionRequest(BaseModel):
    driver_id: int
    vehicle_id: Optional[int] = None
    image_data: str  # Base64 encoded image
    location: Optional[dict] = None
    metadata: Optional[dict] = None

class DetectionResponse(BaseModel):
    success: bool
    event_type: str
    severity: str
    confidence: float
    ear: float
    mar: float
    head_angle: float
    image_path: Optional[str] = None
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    detector_stats: dict

# Middleware para validar API key
async def verify_api_key(x_api_key: str = None):
    if not x_api_key or x_api_key != settings.backend_api_key:
        raise HTTPException(status_code=401, detail="API key inválida")
    return x_api_key

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Endpoint de salud del servicio"""
    try:
        # Verificar conexión con backend
        backend_healthy = await backend_client.health_check()
        
        # Obtener estadísticas del detector
        detector_stats = detector.get_statistics()
        
        return HealthResponse(
            status="healthy" if backend_healthy else "degraded",
            timestamp=datetime.now().isoformat(),
            version=settings.api_version,
            detector_stats=detector_stats
        )
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.now().isoformat(),
            version=settings.api_version,
            detector_stats={}
        )

@app.post("/detect", response_model=DetectionResponse)
async def detect_drowsiness(
    request: DetectionRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Detectar signos de somnolencia en una imagen
    
    Args:
        request: Datos de la solicitud de detección
        api_key: Clave API para autenticación
        
    Returns:
        Resultado de la detección
    """
    try:
        # Decodificar imagen desde base64
        try:
            image_data = base64.b64decode(request.image_data)
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise HTTPException(status_code=400, detail="Imagen inválida")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error al decodificar imagen: {e}")
        
        # Preprocesar imagen
        processed_image = image_processor.preprocess_image(image)
        
        # Detectar somnolencia
        detection_result = detector.detect_drowsiness(processed_image)
        
        if detection_result is None:
            raise HTTPException(status_code=400, detail="No se detectó cara en la imagen")
        
        # Guardar imagen con overlay si es necesario
        image_path = None
        if detection_result.severity.value in ["high", "critical"]:
            # Crear imagen con overlay
            overlay_image = image_processor.draw_detection_overlay(
                processed_image, 
                detection_result,
                show_landmarks=True,
                show_metrics=True
            )
            
            # Guardar imagen
            image_path = image_processor.save_image(overlay_image)
        
        # Enviar evento al backend si es significativo
        if detection_result.event_type.value != "normal":
            await backend_client.send_detection_event(
                driver_id=request.driver_id,
                vehicle_id=request.vehicle_id,
                event_type=detection_result.event_type.value,
                severity=detection_result.severity.value,
                confidence=detection_result.confidence,
                ear=detection_result.ear,
                mar=detection_result.mar,
                head_angle=detection_result.head_angle,
                location=request.location,
                image_path=image_path,
                metadata=request.metadata
            )
        
        return DetectionResponse(
            success=True,
            event_type=detection_result.event_type.value,
            severity=detection_result.severity.value,
            confidence=detection_result.confidence,
            ear=detection_result.ear,
            mar=detection_result.mar,
            head_angle=detection_result.head_angle,
            image_path=image_path,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.post("/detect-batch")
async def detect_batch(
    requests: List[DetectionRequest],
    api_key: str = Depends(verify_api_key)
):
    """
    Detectar somnolencia en múltiples imágenes
    
    Args:
        requests: Lista de solicitudes de detección
        api_key: Clave API para autenticación
        
    Returns:
        Lista de resultados de detección
    """
    results = []
    
    for request in requests:
        try:
            # Procesar cada imagen individualmente
            result = await detect_drowsiness(request, api_key)
            results.append(result.dict())
        except Exception as e:
            results.append({
                "success": False,
                "error": str(e),
                "driver_id": request.driver_id
            })
    
    return {"results": results}

@app.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    driver_id: int = Form(...),
    vehicle_id: Optional[int] = Form(None),
    api_key: str = Depends(verify_api_key)
):
    """
    Subir imagen y detectar somnolencia
    
    Args:
        file: Archivo de imagen
        driver_id: ID del conductor
        vehicle_id: ID del vehículo (opcional)
        api_key: Clave API para autenticación
        
    Returns:
        Resultado de la detección
    """
    try:
        # Leer imagen
        image_data = await file.read()
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Formato de imagen no soportado")
        
        # Convertir a base64 para procesamiento
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Crear request
        request = DetectionRequest(
            driver_id=driver_id,
            vehicle_id=vehicle_id,
            image_data=image_base64
        )
        
        # Procesar detección
        return await detect_drowsiness(request, api_key)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar imagen: {str(e)}")

@app.get("/stats")
async def get_detector_stats(api_key: str = Depends(verify_api_key)):
    """
    Obtener estadísticas del detector
    
    Args:
        api_key: Clave API para autenticación
        
    Returns:
        Estadísticas del detector
    """
    return {
        "detector_stats": detector.get_statistics(),
        "backend_connection": await backend_client.health_check(),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/reset-detector")
async def reset_detector(api_key: str = Depends(verify_api_key)):
    """
    Reiniciar el detector
    
    Args:
        api_key: Clave API para autenticación
        
    Returns:
        Confirmación del reinicio
    """
    detector.reset()
    return {"message": "Detector reiniciado exitosamente"}

@app.post("/cleanup-images")
async def cleanup_images(
    max_age_hours: int = 24,
    api_key: str = Depends(verify_api_key)
):
    """
    Limpiar imágenes antiguas
    
    Args:
        max_age_hours: Edad máxima en horas
        api_key: Clave API para autenticación
        
    Returns:
        Número de archivos eliminados
    """
    deleted_count = image_processor.cleanup_old_images(max_age_hours)
    return {"deleted_files": deleted_count}

# Event handlers
@app.on_event("startup")
async def startup_event():
    """Evento de inicio de la aplicación"""
    print(f"🚀 Servicio de visión iniciado en {settings.host}:{settings.port}")
    print(f"📊 Configuración: EAR={settings.eye_ar_threshold}, MAR={settings.mar_threshold}")
    
    # Verificar conexión con backend
    backend_healthy = await backend_client.health_check()
    if backend_healthy:
        print("✅ Conexión con backend establecida")
    else:
        print("⚠️  Backend no disponible")

@app.on_event("shutdown")
async def shutdown_event():
    """Evento de cierre de la aplicación"""
    print("🔄 Cerrando servicio de visión...")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
