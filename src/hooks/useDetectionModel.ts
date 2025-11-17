/**
 * Hook para manejar la seleccion y uso de modelos de deteccion
 */

import { useState, useEffect, useCallback } from 'react';
import { detectionModelService } from '../services/detectionModel.service';
import type { DetectionModelType, DetectionModel } from '../types/detectionModel.types';

export const useDetectionModel = () => {
  const [currentModel, setCurrentModel] = useState<DetectionModelType>('face-api');
  const [availableModels, setAvailableModels] = useState<DetectionModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // Cargar modelos disponibles y preferencia del usuario
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // Cargar modelos disponibles
        const models = await detectionModelService.getAvailableModels();
        setAvailableModels(models);

        // Cargar preferencia del usuario
        const preference = await detectionModelService.getUserPreference();
        setCurrentModel(preference);
      } catch (error) {
        console.error('Error inicializando modelo:', error);
        // Fallback a face-api
        setCurrentModel('face-api');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Cambiar modelo
  const changeModel = useCallback(async (newModel: DetectionModelType) => {
    try {
      setCurrentModel(newModel);
      await detectionModelService.updateUserPreference(newModel);
      detectionModelService.savePreferredModelLocally(newModel);
    } catch (error) {
      console.error('Error cambiando modelo:', error);
      throw error;
    }
  }, []);

  // Iniciar sesion de deteccion
  const startSession = useCallback(async (driverId: number, vehicleId?: number) => {
    try {
      const id = await detectionModelService.createSession({
        driver_id: driverId,
        vehicle_id: vehicleId,
        detection_model: currentModel
      });
      setSessionId(id);
      return id;
    } catch (error) {
      console.error('Error iniciando sesion:', error);
      throw error;
    }
  }, [currentModel]);

  // Finalizar sesion de deteccion
  const endSession = useCallback(async (stats: {
    totalFrames: number;
    totalEvents: number;
    avgConfidence?: number;
    avgLatency?: number;
    notes?: string;
  }) => {
    if (!sessionId) return;

    try {
      await detectionModelService.endSession(sessionId, {
        total_frames: stats.totalFrames,
        total_events: stats.totalEvents,
        avg_confidence: stats.avgConfidence,
        avg_latency: stats.avgLatency,
        notes: stats.notes
      });
      setSessionId(null);
    } catch (error) {
      console.error('Error finalizando sesion:', error);
      throw error;
    }
  }, [sessionId]);

  return {
    currentModel,
    availableModels,
    loading,
    sessionId,
    changeModel,
    startSession,
    endSession,
    isMediaPipe: currentModel === 'mediapipe',
    isFaceApi: currentModel === 'face-api'
  };
};

