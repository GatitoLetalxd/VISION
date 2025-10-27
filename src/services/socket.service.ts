import { io, Socket } from 'socket.io-client';

// Función para obtener la URL del backend dinámicamente
const getBackendUrl = (): string => {
  // Usar variable de entorno si está disponible
  if (import.meta.env.VITE_API_URL) {
    console.log('🔧 [Socket] Usando VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Detectar la IP desde donde se está accediendo
  const currentHost = window.location.hostname;
  
  console.log('🌐 [Socket] Detectando backend URL para:', currentHost);
  
  // Si se accede desde localhost, usar localhost para el backend
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    const url = 'https://localhost:5005';
    console.log('🏠 [Socket] Acceso local, usando:', url);
    return url;
  }
  
  // Si se accede desde otra IP, usar esa misma IP para el backend
  const url = `https://${currentHost}:5005`;
  console.log('🌍 [Socket] Acceso remoto, usando:', url);
  return url;
};

const BACKEND_URL = getBackendUrl();
console.log('✅ [Socket] BACKEND_URL configurado como:', BACKEND_URL);

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket conectado:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión Socket.IO:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconectado después de', attemptNumber, 'intentos');
    });

    // Escuchar eventos del servidor y redistribuirlos
    this.socket.onAny((eventName, ...args) => {
      const eventListeners = this.listeners.get(eventName);
      if (eventListeners) {
        eventListeners.forEach((callback) => {
          try {
            callback(...args);
          } catch (error) {
            console.error(`Error en listener de evento ${eventName}:`, error);
          }
        });
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('Socket desconectado manualmente');
    }
  }

  // Unirse a la sala de alertas generales
  joinAlerts(): void {
    if (this.socket?.connected) {
      this.socket.emit('join_alerts');
      console.log('📢 Unido a sala de alertas');
    }
  }

  // Unirse a eventos de un conductor específico
  joinDriverEvents(driverId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('join_driver_events', driverId);
      console.log(`👤 Unido a eventos del conductor ${driverId}`);
    }
  }

  // Suscribirse a un evento específico
  on(eventName: string, callback: Function): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);
  }

  // Desuscribirse de un evento
  off(eventName: string, callback: Function): void {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  // Emitir un evento al servidor
  emit(eventName: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(eventName, data);
    } else {
      console.warn('Socket no conectado. No se puede emitir evento:', eventName);
    }
  }

  // Verificar si está conectado
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Exportar una instancia única (singleton)
export const socketService = new SocketService();

// También exportar como default para mayor compatibilidad
export default socketService;
