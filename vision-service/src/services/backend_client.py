"""
Cliente para comunicación con el backend
Envía eventos de detección al sistema principal
"""

import httpx
import asyncio
from typing import Dict, Optional
from datetime import datetime
import json
from loguru import logger

from ..config.settings import settings

class BackendClient:
    """Cliente para comunicación con el backend"""
    
    def __init__(self):
        self.base_url = settings.backend_url
        self.api_key = settings.backend_api_key
        self.timeout = 30.0
        
    async def send_event(self, event_data: Dict) -> bool:
        """
        Enviar evento de detección al backend
        
        Args:
            event_data: Datos del evento a enviar
            
        Returns:
            bool: True si se envió exitosamente, False en caso contrario
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                headers = {
                    "Content-Type": "application/json",
                    settings.api_key_header: self.api_key
                }
                
                response = await client.post(
                    f"{self.base_url}/api/events",
                    json=event_data,
                    headers=headers
                )
                
                if response.status_code == 201:
                    logger.info(f"Evento enviado exitosamente: {event_data.get('eventType')}")
                    return True
                else:
                    logger.error(f"Error al enviar evento: {response.status_code} - {response.text}")
                    return False
                    
        except httpx.TimeoutException:
            logger.error("Timeout al enviar evento al backend")
            return False
        except httpx.ConnectError:
            logger.error("Error de conexión con el backend")
            return False
        except Exception as e:
            logger.error(f"Error inesperado al enviar evento: {e}")
            return False
    
    async def send_detection_event(
        self,
        driver_id: int,
        vehicle_id: Optional[int],
        event_type: str,
        severity: str,
        confidence: float,
        ear: float,
        mar: float,
        head_angle: float,
        location: Optional[Dict] = None,
        image_path: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> bool:
        """
        Enviar evento de detección específico
        
        Args:
            driver_id: ID del conductor
            vehicle_id: ID del vehículo (opcional)
            event_type: Tipo de evento
            severity: Severidad del evento
            confidence: Nivel de confianza
            ear: Eye Aspect Ratio
            mar: Mouth Aspect Ratio
            head_angle: Ángulo de la cabeza
            location: Ubicación GPS (opcional)
            image_path: Ruta de la imagen (opcional)
            metadata: Metadatos adicionales (opcional)
            
        Returns:
            bool: True si se envió exitosamente
        """
        event_data = {
            "driverId": driver_id,
            "vehicleId": vehicle_id,
            "eventType": event_type,
            "severity": severity,
            "confidence": confidence,
            "location": location,
            "imagePath": image_path,
            "metadata": {
                "ear": ear,
                "mar": mar,
                "headAngle": head_angle,
                "timestamp": datetime.now().isoformat(),
                **(metadata or {})
            }
        }
        
        return await self.send_event(event_data)
    
    async def send_batch_events(self, events: list) -> Dict[str, int]:
        """
        Enviar múltiples eventos en lote
        
        Args:
            events: Lista de eventos a enviar
            
        Returns:
            Dict con estadísticas de envío
        """
        results = {"success": 0, "failed": 0}
        
        for event in events:
            success = await self.send_event(event)
            if success:
                results["success"] += 1
            else:
                results["failed"] += 1
        
        logger.info(f"Lote enviado: {results['success']} exitosos, {results['failed']} fallidos")
        return results
    
    async def health_check(self) -> bool:
        """
        Verificar salud del backend
        
        Returns:
            bool: True si el backend está disponible
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Error en health check: {e}")
            return False
    
    async def get_driver_info(self, driver_id: int) -> Optional[Dict]:
        """
        Obtener información del conductor
        
        Args:
            driver_id: ID del conductor
            
        Returns:
            Dict con información del conductor o None
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                headers = {settings.api_key_header: self.api_key}
                
                response = await client.get(
                    f"{self.base_url}/api/drivers/{driver_id}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Error al obtener conductor {driver_id}: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error al obtener conductor {driver_id}: {e}")
            return None
    
    async def get_vehicle_info(self, vehicle_id: int) -> Optional[Dict]:
        """
        Obtener información del vehículo
        
        Args:
            vehicle_id: ID del vehículo
            
        Returns:
            Dict con información del vehículo o None
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                headers = {settings.api_key_header: self.api_key}
                
                response = await client.get(
                    f"{self.base_url}/api/vehicles/{vehicle_id}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Error al obtener vehículo {vehicle_id}: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error al obtener vehículo {vehicle_id}: {e}")
            return None
