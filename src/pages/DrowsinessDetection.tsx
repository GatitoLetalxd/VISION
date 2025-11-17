import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  CircularProgress,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon,
  Cameraswitch as CameraswitchIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import BackgroundShapes from '../components/BackgroundShapes';
import { socketService } from '../services/socket.service';
import { drowsinessDetectionService } from '../services/drowsinessDetection.service';
import type { DrowsinessMetrics } from '../services/drowsinessDetection.service';
import { useDetectionModel } from '../hooks/useDetectionModel';
import { DetectionModelSelector } from '../components/DetectionModelSelector';
import { monitoringService } from '../services/monitoring.service';
import api from '../config/api';

// Definir tipos localmente
interface DrowsinessEvent {
  id_evento?: number;
  id_conductor: number;
  tipo_evento: string;
  nivel_severidad: 'low' | 'medium' | 'high' | 'critical';
  confianza: number;
  timestamp: string;
  datos_adicionales?: any;
}

interface AlertEvent {
  id_alerta?: number;
  nivel_alerta: string;
  mensaje: string;
  timestamp: string;
}

interface DetectionStats {
  totalEvents: number;
  drowsinessCount: number;
  yawnCount: number;
  eyesClosedCount: number;
  lastEventTime: string | null;
}

const DrowsinessDetection = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hook del sistema hibrido
  const {
    currentModel,
    availableModels,
    loading: modelsLoading,
    sessionId,
    changeModel,
    startSession,
    endSession,
    isMediaPipe,
    isFaceApi
  } = useDetectionModel();

  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAlert, setCurrentAlert] = useState<AlertEvent | null>(null);
  const [recentEvents, setRecentEvents] = useState<DrowsinessEvent[]>([]);
  const [detectionMetrics, setDetectionMetrics] = useState<DrowsinessMetrics | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const [stats, setStats] = useState<DetectionStats>({
    totalEvents: 0,
    drowsinessCount: 0,
    yawnCount: 0,
    eyesClosedCount: 0,
    lastEventTime: null,
  });
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number>(16 / 9); // Aspect ratio por defecto 16:9

  // Contadores de tiempo para eventos (en frames)
  const eyesClosedTimeRef = useRef<number>(0);
  const yawnTimeRef = useRef<number>(0);
  const drowsinessTimeRef = useRef<number>(0);
  const eyesClosedRegisteredRef = useRef<boolean>(false);
  const yawnRegisteredRef = useRef<boolean>(false);
  const drowsinessRegisteredRef = useRef<boolean>(false);
  const totalFramesRef = useRef<number>(0);

  useEffect(() => {
    // Obtener información del usuario para el driverId
    const fetchUserData = async () => {
      try {
        const response = await api.get('/user/profile');
        if (response.data) {
          setUserId(response.data.id || response.data.userId);
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
      }
    };
    fetchUserData();

    // Conectar Socket.IO al montar el componente
    socketService.connect();
    socketService.joinAlerts();

    // Escuchar eventos de detección
    const handleDrowsinessEvent = (event: DrowsinessEvent) => {
      console.log('📊 Evento de somnolencia:', event);
      setRecentEvents((prev) => [event, ...prev.slice(0, 9)]); // Mantener últimos 10
      
      // Actualizar estadísticas
      setStats((prev) => ({
        totalEvents: prev.totalEvents + 1,
        drowsinessCount: event.tipo_evento === 'drowsiness_detected' ? prev.drowsinessCount + 1 : prev.drowsinessCount,
        yawnCount: event.tipo_evento === 'yawn_detected' ? prev.yawnCount + 1 : prev.yawnCount,
        eyesClosedCount: event.tipo_evento === 'eyes_closed' ? prev.eyesClosedCount + 1 : prev.eyesClosedCount,
        lastEventTime: event.timestamp,
      }));
    };

    const handleAlertEvent = (alert: AlertEvent) => {
      console.log('🚨 Alerta:', alert);
      setCurrentAlert(alert);
      
      // Auto-limpiar alerta después de 5 segundos
      setTimeout(() => {
        setCurrentAlert(null);
      }, 5000);
    };

    socketService.on('drowsiness_event', handleDrowsinessEvent);
    socketService.on('alert_event', handleAlertEvent);

    // Enumerar cámaras disponibles
    enumerateCameras();

    // Limpiar al desmontar
    return () => {
      socketService.off('drowsiness_event', handleDrowsinessEvent);
      socketService.off('alert_event', handleAlertEvent);
      stopCamera();
    };
  }, []);

  const enumerateCameras = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        
        if (videoDevices.length > 0 && !selectedCameraId) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
        
        console.log('Cámaras detectadas:', videoDevices.map(d => ({ 
          label: d.label || 'Cámara sin nombre', 
          deviceId: d.deviceId 
        })));
      }
    } catch (err) {
      console.error('Error al enumerar cámaras:', err);
    }
  };

  const handleCameraChange = async (cameraId: string) => {
    setSelectedCameraId(cameraId);
    if (isDetecting) {
      stopCamera();
      setTimeout(() => {
        startCameraWithDevice(cameraId);
      }, 500);
    }
  };

  const startCameraWithDevice = async (deviceId?: string) => {
    const targetDeviceId = deviceId || selectedCameraId;
    if (targetDeviceId) {
      await startCamera(targetDeviceId);
    } else {
      await startCamera();
    }
  };

  const startCamera = async (deviceId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificar compatibilidad del navegador
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Intentar polyfill para navegadores antiguos
        const getUserMedia = navigator.getUserMedia || 
                           (navigator as any).webkitGetUserMedia || 
                           (navigator as any).mozGetUserMedia || 
                           (navigator as any).msGetUserMedia;
        
        if (!getUserMedia) {
          throw new Error('Tu navegador no soporta acceso a la cámara. Por favor, usa un navegador moderno como Chrome, Firefox, Safari o Edge.');
        }
        
        // Usar la versión antigua de getUserMedia
        await new Promise((resolve, reject) => {
          getUserMedia.call(navigator, 
            { 
              video: true, 
              audio: false 
            }, 
            (stream: MediaStream) => {
              streamRef.current = stream;
              resolve(stream);
            },
            (err: Error) => reject(err)
          );
        });
      } else {
        // Primero intentar listar dispositivos disponibles
        let devices: MediaDeviceInfo[] = [];
        try {
          devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          console.log('Cámaras disponibles:', videoDevices);
          
          if (videoDevices.length === 0) {
            throw new Error('No se detectaron cámaras conectadas al sistema.');
          }
        } catch (enumError) {
          console.warn('No se pudo enumerar dispositivos:', enumError);
        }

        // Intentar múltiples configuraciones para máxima compatibilidad
        let stream: MediaStream | null = null;
        
        // Si se especifica un deviceId, intentar usarlo primero
        if (deviceId) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { exact: deviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            });
          } catch (deviceErr) {
            console.warn('No se pudo usar la cámara específica, intentando configuración general...', deviceErr);
          }
        }
        
        // Si no hay deviceId o falló, intentar configuraciones generales
        if (!stream) {
          // Configuración 1: Configuración ideal con preferencias
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user',
              },
              audio: false,
            });
          } catch (err1) {
            console.warn('Configuración 1 falló, intentando configuración 2...', err1);
            
            // Configuración 2: Configuración básica sin restricciones
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
            } catch (err2) {
              console.warn('Configuración 2 falló, intentando configuración 3...', err2);
              
              // Configuración 3: Intentar con la primera cámara disponible
              if (devices.length > 0) {
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                if (videoDevices.length > 0) {
                  stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: videoDevices[0].deviceId } },
                    audio: false,
                  });
                } else {
                  throw err2;
                }
              } else {
                throw err2;
              }
            }
          }
        }

        if (!stream) {
          throw new Error('No se pudo iniciar ninguna cámara.');
        }

        streamRef.current = stream;
      }

      // Asignar el stream al elemento de video
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        
        // Intentar reproducir el video
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Reproducción automática bloqueada, el usuario debe interactuar:', playErr);
        }
      }

      setCameraAvailable(true);
      setIsDetecting(true);
      
      // Obtener información de la cámara activa
      if (streamRef.current) {
        const videoTracks = streamRef.current.getVideoTracks();
        if (videoTracks.length > 0) {
          const settings = videoTracks[0].getSettings();
          console.log('Cámara activa:', {
            label: videoTracks[0].label,
            width: settings.width,
            height: settings.height,
            deviceId: settings.deviceId,
          });
        }
      }
      
      // Aquí se enviarían los frames al servicio de visión
      startDetectionLoop();
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      
      let errorMessage = 'No se pudo acceder a la cámara.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = '❌ Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = '📹 No se detectó ninguna cámara conectada. Por favor, conecta una cámara al sistema.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = '⚠️ La cámara está siendo usada por otra aplicación. Por favor, cierra otras aplicaciones que puedan estar usando la cámara.';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage = '⚙️ Las restricciones de la cámara no pueden ser satisfechas. Intentando con configuración básica...';
      } else if (err.name === 'TypeError') {
        errorMessage = '🌐 Tu navegador no soporta acceso a la cámara o no estás usando HTTPS. Por favor, usa un navegador moderno (Chrome, Firefox, Edge) y asegúrate de estar en HTTPS.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setCameraAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = async () => {
    // Detener el intervalo de detección
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    // Finalizar sesión si existe
    if (sessionId) {
      try {
        await endSession({
          totalFrames: totalFramesRef.current,
          totalEvents: stats.totalEvents,
          avgConfidence: detectionMetrics?.confidence || 0,
          notes: `Sesion finalizada. Modelo: ${currentModel}`
        });
      } catch (error) {
        console.error('Error finalizando sesión:', error);
      }
    }

    // Reiniciar el servicio de detección
    drowsinessDetectionService.reset();

    // Reiniciar contadores de tiempo
    eyesClosedTimeRef.current = 0;
    yawnTimeRef.current = 0;
    drowsinessTimeRef.current = 0;
    eyesClosedRegisteredRef.current = false;
    yawnRegisteredRef.current = false;
    drowsinessRegisteredRef.current = false;
    totalFramesRef.current = 0;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Limpiar canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    setCameraAvailable(false);
    setIsDetecting(false);
    setDetectionMetrics(null);
  };

  const startDetectionLoop = async () => {
    console.log('🎥 Iniciando detección de somnolencia con IA...');
    console.log('📊 Modelo seleccionado:', currentModel);
    
    // Crear sesión de detección
    try {
      const driverId = userId || 1; // Usar userId si está disponible, sino usar 1 por defecto
      await startSession(driverId);
      console.log('✅ Sesión de detección creada:', sessionId);
    } catch (error) {
      console.error('Error creando sesión:', error);
    }
    
    // Esperar a que el video esté listo
    if (!videoRef.current) {
      console.error('❌ Video no disponible');
      return;
    }

    // Esperar a que el video tenga dimensiones
    const waitForVideo = () => {
      return new Promise<void>((resolve) => {
        const checkVideo = () => {
          if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            console.log('✅ Video listo:', {
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight
            });
            
            // Configurar dimensiones del canvas
            if (canvasRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              
              // Calcular y actualizar el aspect ratio del video
              const aspectRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
              setVideoAspectRatio(aspectRatio);
              
              console.log('✅ Canvas configurado:', {
                width: canvasRef.current.width,
                height: canvasRef.current.height,
                aspectRatio
              });
            }
            resolve();
          } else {
            setTimeout(checkVideo, 100);
          }
        };
        checkVideo();
      });
    };

    await waitForVideo();
    
    // Cargar modelos si aún no están cargados
    try {
      console.log('📦 Cargando modelos de IA...');
      await drowsinessDetectionService.loadModels();
      console.log('✅ Modelos cargados correctamente');
    } catch (error) {
      console.error('❌ Error al cargar modelos:', error);
      setError('Error al cargar modelos de IA: ' + (error as Error).message);
      return;
    }

    // Limpiar intervalo anterior si existe
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    console.log('🔄 Iniciando loop de detección...');
    
    // Variable local para controlar el loop (el estado React puede no estar actualizado)
    let isRunning = true;
    
    // Loop de detección cada 100ms (10 FPS)
    detectionIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) {
        return;
      }

      // Verificar que el video tenga datos
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        return;
      }

      try {
        // Incrementar contador de frames
        totalFramesRef.current += 1;

        const metrics = await drowsinessDetectionService.detectDrowsiness(
          videoRef.current,
          canvasRef.current
        );

        if (metrics) {
          setDetectionMetrics(metrics);

          // Enviar métricas al servidor para monitoreo en tiempo real
          const driverId = userId || 1; // Usar userId si está disponible
          monitoringService.sendMetrics(metrics, driverId);

          // Capturar y enviar frame de video para monitoreo en tiempo real (sin recuadros de detección)
          if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            try {
              const video = videoRef.current;
              const videoWidth = video.videoWidth;
              const videoHeight = video.videoHeight;
              const isVertical = videoHeight > videoWidth;
              
              // Crear un canvas temporal solo para capturar el video sin recuadros
              const tempCanvas = document.createElement('canvas');
              const tempCtx = tempCanvas.getContext('2d');
              
              if (tempCtx) {
                if (isVertical) {
                  // Para videos verticales, mantener todo el ancho y recortar la altura (centro vertical)
                  // Calcular la altura del recorte (usar el 38% de la altura original centrado)
                  const cropHeight = videoHeight * 0.38;
                  const cropY = (videoHeight - cropHeight) / 2; // Centrar verticalmente
                  
                  // El canvas mantendrá todo el ancho pero recortará la altura (sin bordes negros)
                  tempCanvas.width = videoWidth;
                  tempCanvas.height = cropHeight;
                  
                  // Limpiar el canvas antes de dibujar para evitar bordes negros
                  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                  
                  // Dibujar solo la parte central del video (recortando arriba y abajo)
                  tempCtx.drawImage(
                    video,
                    0, cropY,              // Posición de origen en el video (sx, sy)
                    videoWidth, cropHeight, // Tamaño de origen (sw, sh)
                    0, 0,                   // Posición destino en canvas (dx, dy)
                    videoWidth, cropHeight  // Tamaño destino (dw, dh)
                  );
                } else {
                  // Para videos horizontales, mostrar todo el video
                  tempCanvas.width = videoWidth;
                  tempCanvas.height = videoHeight;
                  tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
                }
                
                const frameData = tempCanvas.toDataURL('image/jpeg', 0.7); // Comprimir a 70% calidad
                const driverId = userId || 1; // Usar userId si está disponible
                monitoringService.sendVideoFrame(frameData, driverId);
              }
            } catch (error) {
              // Silenciar errores de captura de frame (puede fallar si el video no está listo)
              console.debug('No se pudo capturar frame:', error);
            }
          }

          // Reproducir alerta sonora en caso crítico
          if (metrics.drowsinessLevel === 'critical' || metrics.drowsinessLevel === 'high') {
            playAlertSound();
          }

          // Sistema de conteo por tiempo para ojos cerrados (1 segundo = 10 frames a 10 FPS)
          if (metrics.eyesClosed) {
            eyesClosedTimeRef.current += 1;
            
            // Si ha mantenido los ojos cerrados por 1 segundo (10 frames) y no se ha registrado
            if (eyesClosedTimeRef.current >= 10 && !eyesClosedRegisteredRef.current) {
              eyesClosedRegisteredRef.current = true;
              console.log('👁️ OJOS CERRADOS POR 1 SEGUNDO - Registrando en estadísticas');
              
              setStats(prev => ({
                ...prev,
                eyesClosedCount: prev.eyesClosedCount + 1,
                totalEvents: prev.totalEvents + 1,
                lastEventTime: new Date().toISOString(),
              }));

              // Emitir evento al backend
              const event: Partial<DrowsinessEvent> = {
                id_conductor: 1,
                tipo_evento: 'eyes_closed',
                nivel_severidad: 'high',
                confianza: metrics.confidence,
                timestamp: new Date().toISOString(),
                datos_adicionales: {
                  ear: metrics.ear.average,
                  duration_seconds: 1,
                  eyesClosed: true,
                },
              };
              socketService.emit('drowsiness_event', event);
            }
          } else {
            // Reiniciar contador si abre los ojos
            eyesClosedTimeRef.current = 0;
            eyesClosedRegisteredRef.current = false;
          }

          // Sistema de conteo por tiempo para bostezos (1.5 segundos = 15 frames a 10 FPS)
          if (metrics.yawning) {
            yawnTimeRef.current += 1;
            
            // Si ha estado bostezando por 1.5 segundos (15 frames) y no se ha registrado
            if (yawnTimeRef.current >= 15 && !yawnRegisteredRef.current) {
              yawnRegisteredRef.current = true;
              console.log('🥱 BOSTEZO POR 1.5 SEGUNDOS - Registrando en estadísticas');
              
              setStats(prev => ({
                ...prev,
                yawnCount: prev.yawnCount + 1,
                totalEvents: prev.totalEvents + 1,
                lastEventTime: new Date().toISOString(),
              }));

              // Emitir evento al backend
              const event: Partial<DrowsinessEvent> = {
                id_conductor: 1,
                tipo_evento: 'yawn_detected',
                nivel_severidad: 'medium',
                confianza: metrics.confidence,
                timestamp: new Date().toISOString(),
                datos_adicionales: {
                  mar: metrics.mar.ratio,
                  duration_seconds: 1.5,
                  yawning: true,
                },
              };
              socketService.emit('drowsiness_event', event);
            }
          } else {
            // Reiniciar contador si cierra la boca
            yawnTimeRef.current = 0;
            yawnRegisteredRef.current = false;
          }

          // Registrar somnolencia crítica (ojos cerrados + bostezo por 1.5 segundos = 15 frames)
          if (metrics.eyesClosed && metrics.yawning) {
            drowsinessTimeRef.current += 1;
            
            // Si ha mantenido somnolencia crítica por 1.5 segundos (15 frames) y no se ha registrado
            if (drowsinessTimeRef.current >= 15 && !drowsinessRegisteredRef.current) {
              drowsinessRegisteredRef.current = true;
              console.log('😴 SOMNOLENCIA CRÍTICA POR 1.5 SEGUNDOS - Registrando en estadísticas');
              
              setStats(prev => ({
                ...prev,
                drowsinessCount: prev.drowsinessCount + 1,
                totalEvents: prev.totalEvents + 1,
                lastEventTime: new Date().toISOString(),
              }));

              // Emitir evento crítico
              const event: Partial<DrowsinessEvent> = {
                id_conductor: 1,
                tipo_evento: 'drowsiness_detected',
                nivel_severidad: 'critical',
                confianza: metrics.confidence,
                timestamp: new Date().toISOString(),
                datos_adicionales: {
                  ear: metrics.ear.average,
                  mar: metrics.mar.ratio,
                  eyesClosed: true,
                  yawning: true,
                  duration_seconds: 1.5,
                },
              };
              socketService.emit('drowsiness_event', event);
            }
          } else {
            // Reiniciar contador si deja de tener somnolencia crítica
            drowsinessTimeRef.current = 0;
            drowsinessRegisteredRef.current = false;
          }
        }
      } catch (error) {
        console.error('Error en detección:', error);
      }
    }, 100); // 10 FPS
  };

  // Función para reproducir sonido de alerta
  const playAlertSound = () => {
    try {
      // Crear un contexto de audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Crear un oscilador (generador de tono)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Configurar el oscilador
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar frecuencia (880 Hz = A5 - tono de alerta agudo)
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      
      // Configurar volumen (fade out)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      // Reproducir
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('No se pudo reproducir el sonido de alerta:', error);
    }
  };

  const getAlertColor = (nivel: string) => {
    switch (nivel) {
      case 'critical':
        return '#ff1744';
      case 'danger':
        return '#ff5252';
      case 'warning':
        return '#ffa726';
      default:
        return '#42a5f5';
    }
  };

  const getEventIcon = (tipo: string) => {
    switch (tipo) {
      case 'drowsiness_detected':
        return '😴';
      case 'yawn_detected':
        return '🥱';
      case 'eyes_closed':
        return '👁️';
      case 'distraction_detected':
        return '⚠️';
      default:
        return '📊';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 25%, #0f1419 50%, #1a1f3a 75%, #0a0e27 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(123, 47, 247, 0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      <BackgroundShapes />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Volver">
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  background: 'rgba(0, 212, 255, 0.1)',
                  boxShadow: '0 4px 16px rgba(0, 212, 255, 0.3)',
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
            }}
          >
            Detección de Somnolencia en Tiempo Real
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              icon={socketService.isConnected() ? <CheckCircleIcon /> : <ErrorIcon />}
              label={socketService.isConnected() ? 'Conectado' : 'Desconectado'}
              color={socketService.isConnected() ? 'success' : 'error'}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Video Feed */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}
                >
                  <VideocamIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Video en Vivo
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Chip
                    label={`Modelo: ${currentModel === 'face-api' ? 'face-api.js' : 'MediaPipe'}`}
                    color={isMediaPipe ? 'secondary' : 'primary'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    disabled={isDetecting}
                    sx={{
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'rgba(0, 212, 255, 0.6)',
                        background: 'rgba(0, 212, 255, 0.1)',
                      },
                    }}
                  >
                    {showModelSelector ? 'Ocultar Config' : 'Cambiar Modelo'}
                  </Button>
                </Box>
                <Box>
                  {!isDetecting ? (
                    <Button
                      component={motion.button}
                      whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0, 212, 255, 0.6)' }}
                      whileTap={{ scale: 0.98 }}
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VideocamIcon />}
                      onClick={startCamera}
                      disabled={loading}
                      sx={{
                        background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
                        boxShadow: '0 8px 25px rgba(0, 212, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {loading ? 'Iniciando...' : 'Iniciar Detección'}
                    </Button>
                  ) : (
                    <Button
                      component={motion.button}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      variant="contained"
                      color="error"
                      startIcon={<VideocamOffIcon />}
                      onClick={stopCamera}
                    >
                      Detener
                    </Button>
                  )}
                </Box>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <AlertTitle>Error</AlertTitle>
                  {error}
                </Alert>
              )}

              {/* Selector de Cámara */}
              {availableCameras.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth variant="outlined" sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                      '& fieldset': {
                        borderColor: 'rgba(0, 212, 255, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(0, 212, 255, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00d4ff',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-focused': {
                        color: '#00d4ff',
                      },
                    },
                    '& .MuiSelect-icon': {
                      color: '#00d4ff',
                    },
                  }}>
                    <InputLabel id="camera-select-label">
                      <CameraswitchIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                      Seleccionar Cámara ({availableCameras.length} disponible{availableCameras.length > 1 ? 's' : ''})
                    </InputLabel>
                    <Select
                      labelId="camera-select-label"
                      value={selectedCameraId}
                      label={`Seleccionar Cámara (${availableCameras.length} disponible${availableCameras.length > 1 ? 's' : ''})`}
                      onChange={(e) => handleCameraChange(e.target.value)}
                      disabled={loading}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            background: 'linear-gradient(145deg, rgba(26, 31, 58, 0.98) 0%, rgba(15, 20, 25, 0.98) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(0, 212, 255, 0.2)',
                            '& .MuiMenuItem-root': {
                              color: 'white',
                              '&:hover': {
                                background: 'rgba(0, 212, 255, 0.1)',
                              },
                              '&.Mui-selected': {
                                background: 'rgba(0, 212, 255, 0.2)',
                                '&:hover': {
                                  background: 'rgba(0, 212, 255, 0.25)',
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      {availableCameras.map((camera, index) => (
                        <MenuItem key={camera.deviceId} value={camera.deviceId}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <VideocamIcon sx={{ mr: 1, color: '#00d4ff', fontSize: 20 }} />
                            <Typography sx={{ flex: 1 }}>
                              {camera.label || `Cámara ${index + 1}`}
                            </Typography>
                            {selectedCameraId === camera.deviceId && isDetecting && (
                              <Chip 
                                label="Activa" 
                                size="small" 
                                sx={{ 
                                  ml: 1,
                                  background: 'rgba(76, 175, 80, 0.2)', 
                                  color: '#4caf50',
                                  border: '1px solid #4caf50',
                                }} 
                              />
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Alerta actual */}
              {currentAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Alert
                    severity="warning"
                    icon={<WarningIcon fontSize="large" />}
                    sx={{
                      mb: 2,
                      backgroundColor: getAlertColor(currentAlert.nivel_alerta) + '20',
                      border: `2px solid ${getAlertColor(currentAlert.nivel_alerta)}`,
                      '& .MuiAlert-icon': {
                        color: getAlertColor(currentAlert.nivel_alerta),
                      },
                    }}
                  >
                    <AlertTitle sx={{ fontWeight: 700 }}>
                      ¡{currentAlert.nivel_alerta.toUpperCase()}!
                    </AlertTitle>
                    {currentAlert.mensaje}
                  </Alert>
                </motion.div>
              )}

              {/* Video Display */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  // Aspect ratio dinámico basado en las dimensiones reales del video
                  // Para videos verticales en móviles, usar altura fija
                  ...(videoAspectRatio < 1 ? {
                    paddingTop: 0,
                    height: {
                      xs: '70vh',
                      sm: `${(1 / videoAspectRatio) * 100}%`,
                    },
                  } : {
                    paddingTop: `${(1 / videoAspectRatio) * 100}%`,
                  }),
                  backgroundColor: 'black',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: {
                    xs: detectionMetrics?.drowsinessLevel === 'critical' ? '2px solid #ff1744' :
                        detectionMetrics?.drowsinessLevel === 'high' ? '2px solid #ff1744' :
                        detectionMetrics?.drowsinessLevel === 'medium' ? '2px solid #ff9800' :
                        detectionMetrics?.drowsinessLevel === 'low' ? '1px solid #ffeb3b' :
                        cameraAvailable ? '1px solid #00d4ff' : '1px solid rgba(255, 255, 255, 0.1)',
                    sm: detectionMetrics?.drowsinessLevel === 'critical' ? '3px solid #ff1744' :
                        detectionMetrics?.drowsinessLevel === 'high' ? '2px solid #ff1744' :
                        detectionMetrics?.drowsinessLevel === 'medium' ? '2px solid #ff9800' :
                        detectionMetrics?.drowsinessLevel === 'low' ? '2px solid #ffeb3b' :
                        cameraAvailable ? '2px solid #00d4ff' : '2px solid rgba(255, 255, 255, 0.1)',
                    md: detectionMetrics?.drowsinessLevel === 'critical' ? '4px solid #ff1744' :
                        detectionMetrics?.drowsinessLevel === 'high' ? '3px solid #ff1744' :
                        detectionMetrics?.drowsinessLevel === 'medium' ? '3px solid #ff9800' :
                        detectionMetrics?.drowsinessLevel === 'low' ? '2px solid #ffeb3b' :
                        cameraAvailable ? '2px solid #00d4ff' : '2px solid rgba(255, 255, 255, 0.1)',
                  },
                  boxShadow: detectionMetrics?.drowsinessLevel === 'critical' ? '0 0 40px rgba(255, 23, 68, 0.8)' :
                             detectionMetrics?.drowsinessLevel === 'high' ? '0 0 30px rgba(255, 23, 68, 0.6)' :
                             detectionMetrics?.drowsinessLevel === 'medium' ? '0 0 20px rgba(255, 152, 0, 0.6)' :
                             detectionMetrics?.drowsinessLevel === 'low' ? '0 0 15px rgba(255, 235, 59, 0.5)' :
                             cameraAvailable ? '0 0 20px rgba(0, 212, 255, 0.4)' : 'none',
                  animation: detectionMetrics?.drowsinessLevel === 'critical' ? 'pulseBorderFast 0.5s ease-in-out infinite' :
                             detectionMetrics?.drowsinessLevel === 'high' ? 'pulseBorder 1s ease-in-out infinite' :
                             detectionMetrics?.drowsinessLevel === 'medium' ? 'pulseBorderOrange 1.5s ease-in-out infinite' :
                             detectionMetrics?.drowsinessLevel === 'low' ? 'pulseBorderYellow 2s ease-in-out infinite' :
                             'none',
                  transition: 'all 0.3s ease',
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain', // Cambiar a contain para evitar compresión
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    objectFit: 'contain', // Mantener proporciones sin comprimir
                  }}
                />
                {!cameraAvailable && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    <VideocamOffIcon sx={{ fontSize: 64, mb: 2 }} />
                    <Typography>Cámara no activa</Typography>
                  </Box>
                )}

                {/* Barra de alerta superior */}
                {detectionMetrics && (detectionMetrics.drowsinessLevel === 'high' || detectionMetrics.drowsinessLevel === 'critical') && (
                  <Box
                    component={motion.div}
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      zIndex: 20,
                      background: detectionMetrics.drowsinessLevel === 'critical' 
                        ? 'linear-gradient(180deg, rgba(255, 23, 68, 0.95) 0%, rgba(198, 40, 40, 0.90) 100%)'
                        : 'linear-gradient(180deg, rgba(255, 82, 82, 0.90) 0%, rgba(229, 57, 53, 0.85) 100%)',
                      padding: {
                        xs: '6px 10px',
                        sm: '8px 12px',
                        md: '10px 16px',
                        lg: '12px 20px',
                      },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: { xs: 0.5, sm: 1, md: 1.5, lg: 2 },
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                      animation: detectionMetrics.drowsinessLevel === 'critical' ? 'shake 0.5s infinite' : 'none',
                    }}
                  >
                    <WarningIcon 
                      sx={{ 
                        fontSize: { xs: 18, sm: 20, md: 24, lg: 28 },
                        color: 'white',
                        animation: 'pulse 0.8s infinite',
                        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))',
                      }} 
                    />
                    <Typography
                      sx={{
                        color: 'white',
                        fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.9rem', lg: '1.1rem' },
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: { xs: '0.05em', sm: '0.08em', md: '0.1em' },
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      {detectionMetrics.drowsinessLevel === 'critical' 
                        ? '¡ALERTA CRITICA! DETENGA EL VEHICULO'
                        : '¡ALERTA! SIGNOS DE SOMNOLENCIA DETECTADOS'}
                    </Typography>
                    <WarningIcon 
                      sx={{ 
                        fontSize: 28,
                        color: 'white',
                        animation: 'pulse 0.8s infinite',
                        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))',
                      }} 
                    />
                  </Box>
                )}

                {/* Overlay de métricas en tiempo real */}
                {detectionMetrics && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '1%',
                      left: '1%',
                      width: 'auto',
                      maxWidth: {
                        xs: '50%',
                        sm: '40%',
                        md: '30%',
                        lg: '25%',
                      },
                      background: 'rgba(0, 0, 0, 0.45)',
                      backdropFilter: 'blur(6px)',
                      padding: {
                        xs: '4px 6px',
                        sm: '6px 8px',
                        md: '8px 10px',
                        lg: '10px 12px',
                      },
                      borderRadius: { xs: 1, sm: 1.5, md: 2 },
                      border: `2px solid ${
                        detectionMetrics.drowsinessLevel === 'critical' ? '#ff1744' :
                        detectionMetrics.drowsinessLevel === 'high' ? '#ff5252' :
                        detectionMetrics.drowsinessLevel === 'medium' ? '#ffa726' :
                        detectionMetrics.drowsinessLevel === 'low' ? '#ffeb3b' :
                        '#4caf50'
                      }`,
                      boxShadow: `0 0 15px ${
                        detectionMetrics.drowsinessLevel === 'critical' ? 'rgba(255, 23, 68, 0.4)' :
                        detectionMetrics.drowsinessLevel === 'high' ? 'rgba(255, 82, 82, 0.4)' :
                        detectionMetrics.drowsinessLevel === 'medium' ? 'rgba(255, 167, 38, 0.4)' :
                        detectionMetrics.drowsinessLevel === 'low' ? 'rgba(255, 235, 59, 0.4)' :
                        'rgba(76, 175, 80, 0.4)'
                      }`,
                    }}
                  >
                    <Stack spacing={{ xs: 0.3, sm: 0.5, md: 0.7, lg: 0.8 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.4, sm: 0.6, md: 0.7, lg: 0.8 } }}>
                        <Box
                          sx={{
                            width: { xs: 7, sm: 9, md: 11, lg: 12 },
                            height: { xs: 7, sm: 9, md: 11, lg: 12 },
                            borderRadius: '50%',
                            backgroundColor: detectionMetrics.eyesClosed ? '#ff1744' : '#4caf50',
                            boxShadow: detectionMetrics.eyesClosed ? '0 0 10px #ff1744' : '0 0 10px #4caf50',
                            animation: detectionMetrics.eyesClosed ? 'pulse 1s infinite' : 'none',
                          }}
                        />
                        <Typography sx={{ 
                          color: 'white', 
                          fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem', lg: '0.85rem' }, 
                          fontWeight: 600,
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                        }}>
                          {detectionMetrics.eyesClosed ? '😴 OJOS CERRADOS' : '👀 Ojos'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.4, sm: 0.6, md: 0.7, lg: 0.8 } }}>
                        <Box
                          sx={{
                            width: { xs: 7, sm: 9, md: 11, lg: 12 },
                            height: { xs: 7, sm: 9, md: 11, lg: 12 },
                            borderRadius: '50%',
                            backgroundColor: detectionMetrics.yawning ? '#ffa726' : '#4caf50',
                            boxShadow: detectionMetrics.yawning ? '0 0 10px #ffa726' : '0 0 10px #4caf50',
                            animation: detectionMetrics.yawning ? 'pulse 1s infinite' : 'none',
                          }}
                        />
                        <Typography sx={{ 
                          color: 'white', 
                          fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem', lg: '0.85rem' }, 
                          fontWeight: 600,
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                        }}>
                          {detectionMetrics.yawning ? '🥱 BOSTEZANDO' : '😊 Boca'}
                        </Typography>
                      </Box>

                      <Box sx={{ mt: { xs: 0.2, sm: 0.3, md: 0.4 }, pt: { xs: 0.3, sm: 0.5, md: 0.7, lg: 0.8 }, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                        <Typography sx={{ 
                          color: '#00d4ff', 
                          fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.7rem', lg: '0.8rem' }, 
                          fontWeight: 600, 
                          mb: { xs: 0.2, sm: 0.3, md: 0.4 },
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                        }}>
                          📊 EAR
                        </Typography>
                        <Box sx={{ display: 'flex', gap: { xs: 0.3, sm: 0.5, md: 0.7, lg: 0.8 } }}>
                          <Typography sx={{ 
                            color: 'white', 
                            fontSize: { xs: '0.48rem', sm: '0.55rem', md: '0.65rem', lg: '0.75rem' },
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                          }}>
                            I: {detectionMetrics.ear.left.toFixed(2)}
                          </Typography>
                          <Typography sx={{ 
                            color: 'white', 
                            fontSize: { xs: '0.48rem', sm: '0.55rem', md: '0.65rem', lg: '0.75rem' },
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                          }}>
                            D: {detectionMetrics.ear.right.toFixed(2)}
                          </Typography>
                          <Typography sx={{ 
                            color: '#00ffea', 
                            fontSize: { xs: '0.48rem', sm: '0.55rem', md: '0.65rem', lg: '0.75rem' }, 
                            fontWeight: 700,
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                          }}>
                            P: {detectionMetrics.ear.average.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box>
                        <Typography sx={{ 
                          color: '#00d4ff', 
                          fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.7rem', lg: '0.8rem' }, 
                          fontWeight: 600, 
                          mb: { xs: 0.2, sm: 0.3, md: 0.4 },
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                        }}>
                          📊 MAR
                        </Typography>
                        <Typography sx={{ 
                          color: '#00ffea', 
                          fontSize: { xs: '0.48rem', sm: '0.55rem', md: '0.65rem', lg: '0.75rem' },
                          fontWeight: 700,
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                        }}>
                          {detectionMetrics.mar.ratio.toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ mt: { xs: 0.2, sm: 0.3, md: 0.4 }, pt: { xs: 0.3, sm: 0.5, md: 0.7, lg: 0.8 }, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                        <Typography sx={{ 
                          color: '#ffa726', 
                          fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.7rem', lg: '0.8rem' }, 
                          fontWeight: 600, 
                          mb: { xs: 0.2, sm: 0.3, md: 0.4 },
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                        }}>
                          🎯 Nivel
                        </Typography>
                        <Chip
                          label={detectionMetrics.drowsinessLevel.toUpperCase()}
                          size="small"
                          sx={{
                            backgroundColor: 
                              detectionMetrics.drowsinessLevel === 'critical' ? '#ff1744' :
                              detectionMetrics.drowsinessLevel === 'high' ? '#ff5252' :
                              detectionMetrics.drowsinessLevel === 'medium' ? '#ffa726' :
                              detectionMetrics.drowsinessLevel === 'low' ? '#ffeb3b' :
                              '#4caf50',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: { xs: '0.45rem', sm: '0.55rem', md: '0.65rem', lg: '0.75rem' },
                            height: { xs: 16, sm: 18, md: 22, lg: 26 },
                            '& .MuiChip-label': {
                              padding: { xs: '0 4px', sm: '0 6px', md: '0 10px', lg: '0 12px' },
                            },
                          }}
                        />
                      </Box>

                      <Box>
                        <Typography sx={{ 
                          color: '#4caf50', 
                          fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.7rem', lg: '0.8rem' }, 
                          fontWeight: 600, 
                          mb: { xs: 0.2, sm: 0.3, md: 0.4 },
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                        }}>
                          ✅ Conf.
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.3, sm: 0.5, md: 0.7, lg: 0.8 } }}>
                          <Box
                            sx={{
                              flex: 1,
                              height: { xs: 4, sm: 5, md: 6, lg: 7 },
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              borderRadius: { xs: 2, sm: 2.5, md: 3 },
                              overflow: 'hidden',
                              minWidth: { xs: 40, sm: 50, md: 60, lg: 70 },
                            }}
                          >
                            <Box
                              sx={{
                                width: `${detectionMetrics.confidence * 100}%`,
                                height: '100%',
                                backgroundColor: '#4caf50',
                                boxShadow: '0 0 10px #4caf50',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </Box>
                          <Typography sx={{ 
                            color: '#4caf50', 
                            fontSize: { xs: '0.48rem', sm: '0.55rem', md: '0.65rem', lg: '0.75rem' }, 
                            fontWeight: 700, 
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                          }}>
                            {(detectionMetrics.confidence * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                )}
              </Box>

              {/* Panel de umbrales y configuración del modelo */}
              {isDetecting && (
                <Box sx={{ mt: 3 }}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      background: 'rgba(0, 212, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: '#00d4ff',
                        fontWeight: 600,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      ⚙️ Parámetros del Modelo IA
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', mb: 0.5 }}>
                            Umbral EAR (Ojos)
                          </Typography>
                          <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 700 }}>
                            {'<'} 0.29
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', mb: 0.5 }}>
                            Umbral MAR (Boca)
                          </Typography>
                          <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 700 }}>
                            {'>'} 0.50
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', mb: 0.5 }}>
                            FPS de Detección
                          </Typography>
                          <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 700 }}>
                            ~10 FPS
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', mb: 0.5 }}>
                            Modelo
                          </Typography>
                          <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 700 }}>
                            TinyFaceDetector
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', mb: 0.5 }}>
                            Estado del Modelo
                          </Typography>
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Activo y Detectando"
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(76, 175, 80, 0.2)',
                              color: '#4caf50',
                              border: '1px solid #4caf50',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              )}
            </Paper>

            {/* Selector de Modelo */}
            {showModelSelector && (
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  mt: 3,
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  borderRadius: 4,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
              >
                <DetectionModelSelector
                  selectedModel={currentModel}
                  onModelChange={async (newModel) => {
                    if (isDetecting) {
                      setError('Detén la detección antes de cambiar de modelo');
                      return;
                    }
                    try {
                      await changeModel(newModel);
                      setShowModelSelector(false);
                    } catch (error) {
                      setError('Error al cambiar modelo: ' + (error as Error).message);
                    }
                  }}
                  showDetails={true}
                />
              </Paper>
            )}
          </Grid>

          {/* Statistics Panel */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              {/* Stats Card */}
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  borderRadius: 4,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}
                >
                  Estadísticas de Sesión
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        background: 'rgba(0, 212, 255, 0.1)',
                        border: '1px solid rgba(0, 212, 255, 0.3)',
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#00d4ff', fontWeight: 700 }}>
                          {stats.totalEvents}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'white' }}>
                          Total Eventos
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        background: 'rgba(255, 167, 38, 0.1)',
                        border: '1px solid rgba(255, 167, 38, 0.3)',
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#ffa726', fontWeight: 700 }}>
                          {stats.drowsinessCount}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'white' }}>
                          Somnolencia
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        background: 'rgba(123, 47, 247, 0.1)',
                        border: '1px solid rgba(123, 47, 247, 0.3)',
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#7b2ff7', fontWeight: 700 }}>
                          {stats.yawnCount}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'white' }}>
                          Bostezos
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        background: 'rgba(0, 255, 234, 0.1)',
                        border: '1px solid rgba(0, 255, 234, 0.3)',
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#00ffea', fontWeight: 700 }}>
                          {stats.eyesClosedCount}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'white' }}>
                          Ojos Cerrados
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              {/* Recent Events */}
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  borderRadius: 4,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                  maxHeight: '400px',
                  overflow: 'auto',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 600,
                  }}
                >
                  Eventos Recientes
                </Typography>

                {recentEvents.length === 0 ? (
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', py: 2 }}>
                    No hay eventos registrados
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {recentEvents.map((event) => (
                      <motion.div
                        key={event.id_evento}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Card
                          sx={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontSize: '1.5rem' }}>
                                {getEventIcon(event.tipo_evento)}
                              </Typography>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                                  {event.tipo_evento.replace('_', ' ').toUpperCase()}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                  Confianza: {(event.confianza * 100).toFixed(0)}% •{' '}
                                  {new Date(event.timestamp).toLocaleTimeString()}
                                </Typography>
                              </Box>
                              <Chip
                                label={event.nivel_severidad}
                                size="small"
                                sx={{
                                  backgroundColor:
                                    event.nivel_severidad === 'critical'
                                      ? '#ff1744'
                                      : event.nivel_severidad === 'high'
                                      ? '#ff5252'
                                      : event.nivel_severidad === 'medium'
                                      ? '#ffa726'
                                      : '#42a5f5',
                                  color: 'white',
                                  fontWeight: 600,
                                }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DrowsinessDetection;

