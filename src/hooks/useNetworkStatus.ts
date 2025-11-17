/**
 * Hook para detectar el estado de conexión a internet
 */

import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean; // Indica si acaba de recuperar la conexión
}

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Resetear el flag después de un tiempo
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    // Escuchar eventos del navegador
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar también el estado de Socket.IO si está disponible
    const checkConnection = () => {
      // Verificar si hay conexión real haciendo un fetch simple
      fetch('/favicon.ico', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      }).catch(() => {
        // Si falla, probablemente no hay conexión
        if (navigator.onLine) {
          setIsOnline(false);
        }
      });
    };

    // Verificar periódicamente (cada 5 segundos)
    const interval = setInterval(checkConnection, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, wasOffline };
};

