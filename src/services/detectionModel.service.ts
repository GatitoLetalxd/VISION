/**
 * Servicio para gestion de modelos de deteccion
 */

import axios from 'axios';
import { SERVER_URL } from '../config/api';
import type {
  DetectionModel,
  DetectionPreference,
  CreateSessionRequest,
  EndSessionRequest,
  ModelStatistics,
  DetectionModelType
} from '../types/detectionModel.types';

const API_URL = `${SERVER_URL}/api/detection`;

class DetectionModelService {
  /**
   * Obtener todos los modelos disponibles
   */
  async getAvailableModels(): Promise<DetectionModel[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/models`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.models;
    } catch (error) {
      console.error('Error obteniendo modelos:', error);
      throw error;
    }
  }

  /**
   * Obtener modelo especifico
   */
  async getModelByName(modelName: DetectionModelType): Promise<DetectionModel> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/models/${modelName}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.model;
    } catch (error) {
      console.error('Error obteniendo modelo:', error);
      throw error;
    }
  }

  /**
   * Obtener preferencia del usuario
   */
  async getUserPreference(): Promise<DetectionModelType> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<DetectionPreference>(`${API_URL}/preference`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.preferred_model;
    } catch (error) {
      console.error('Error obteniendo preferencia:', error);
      // Default to face-api
      return 'face-api';
    }
  }

  /**
   * Actualizar preferencia del usuario
   */
  async updateUserPreference(model: DetectionModelType): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/preference`,
        { preferred_model: model },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (error) {
      console.error('Error actualizando preferencia:', error);
      throw error;
    }
  }

  /**
   * Crear sesion de deteccion
   */
  async createSession(data: CreateSessionRequest): Promise<number> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/sessions`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.session_id;
    } catch (error) {
      console.error('Error creando sesion:', error);
      throw error;
    }
  }

  /**
   * Finalizar sesion de deteccion
   */
  async endSession(sessionId: number, data: EndSessionRequest): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/sessions/${sessionId}/end`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (error) {
      console.error('Error finalizando sesion:', error);
      throw error;
    }
  }

  /**
   * Obtener estadisticas de modelos
   */
  async getStatistics(): Promise<ModelStatistics[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.statistics;
    } catch (error) {
      console.error('Error obteniendo estadisticas:', error);
      throw error;
    }
  }

  /**
   * Detectar con MediaPipe (servidor Python)
   */
  async detectWithMediaPipe(imageData: string, driverId: number): Promise<any> {
    try {
      // URL del servicio Python
      const pythonServiceUrl = import.meta.env.VITE_PYTHON_SERVICE_URL || 'https://localhost:8000';
      
      const response = await axios.post(
        `${pythonServiceUrl}/detect`,
        {
          driver_id: driverId,
          image_data: imageData
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error detectando con MediaPipe:', error);
      throw error;
    }
  }

  /**
   * Guardar modelo preferido en localStorage (cache local)
   */
  savePreferredModelLocally(model: DetectionModelType): void {
    localStorage.setItem('preferred_detection_model', model);
  }

  /**
   * Obtener modelo preferido de localStorage
   */
  getPreferredModelLocally(): DetectionModelType {
    const saved = localStorage.getItem('preferred_detection_model');
    return (saved === 'mediapipe' ? 'mediapipe' : 'face-api') as DetectionModelType;
  }
}

export const detectionModelService = new DetectionModelService();

