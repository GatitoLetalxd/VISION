// Constantes de configuración centralizadas para el frontend

// URLs y endpoints - Detección dinámica de IP
const getServerUrl = () => {
  // En desarrollo, usar localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  // En producción, usar la IP desde donde se accede
  return `http://${window.location.hostname}:5000`;
};

const getFrontendUrl = () => {
  // En desarrollo, usar localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:5173';
  }
  // En producción, usar la IP desde donde se accede
  return `http://${window.location.hostname}:5173`;
};

export const API_BASE_URL = getServerUrl();
export const FRONTEND_URL = getFrontendUrl();

// Configuración de archivos
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

// Configuración de UI
export const ANIMATION_DURATION = 300; // ms
export const CAROUSEL_INTERVAL = 5000; // ms
export const TOAST_DURATION = 6000; // ms

// Roles de usuario
export const USER_ROLES = {
  USER: 'usuario',
  ADMIN: 'admin',
  SUPER_ADMIN: 'superadmin'
} as const;

// Estados de procesamiento
export const PROCESSING_STATES = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error'
} as const;

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Por favor, intenta de nuevo.',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
  FILE_TOO_LARGE: 'El archivo excede el tamaño máximo permitido (5MB).',
  INVALID_FILE_TYPE: 'Tipo de archivo no válido. Solo se permiten imágenes.',
  GENERIC_ERROR: 'Ha ocurrido un error inesperado.'
} as const;

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  IMAGE_UPLOADED: 'Imagen subida correctamente',
  IMAGE_PROCESSED: 'Imagen procesada correctamente',
  IMAGE_DELETED: 'Imagen eliminada correctamente',
  PROFILE_UPDATED: 'Perfil actualizado correctamente'
} as const; 