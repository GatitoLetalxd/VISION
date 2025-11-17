import api from '../config/api';

interface DetectionMetrics {
  eyesClosed: boolean;
  yawning: boolean;
  ear: {
    left: number;
    right: number;
    average: number;
  };
  mar: {
    ratio: number;
  };
  drowsinessLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: number;
}

class MonitoringService {
  private lastSentTime: number = 0;
  private lastFrameSentTime: number = 0;
  private sendInterval: number = 2000; // Enviar métricas cada 2 segundos
  private frameInterval: number = 500; // Enviar frames cada 500ms (2 FPS para reducir ancho de banda)

  async sendMetrics(metrics: DetectionMetrics, driverId?: number): Promise<void> {
    const now = Date.now();
    
    // Solo enviar si han pasado más de sendInterval ms
    if (now - this.lastSentTime < this.sendInterval) {
      return;
    }

    try {
      await api.post('/monitoring/metrics', {
        metrics,
        driverId,
      });
      
      this.lastSentTime = now;
    } catch (error) {
      console.error('Error al enviar métricas:', error);
    }
  }

  async sendVideoFrame(frameData: string, driverId?: number): Promise<void> {
    const now = Date.now();
    
    // Solo enviar si han pasado más de frameInterval ms
    if (now - this.lastFrameSentTime < this.frameInterval) {
      return;
    }

    try {
      await api.post('/monitoring/video-frame', {
        frameData,
        driverId,
        timestamp: now,
      });
      
      this.lastFrameSentTime = now;
    } catch (error) {
      console.error('Error al enviar frame de video:', error);
    }
  }

  setSendInterval(interval: number): void {
    this.sendInterval = interval;
  }

  setFrameInterval(interval: number): void {
    this.frameInterval = interval;
  }
}

export const monitoringService = new MonitoringService();
export default monitoringService;

