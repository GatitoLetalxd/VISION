import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Grid,
  Paper,
  Chip,
  Card,
  CardContent,
  Button,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VideocamIcon from '@mui/icons-material/Videocam';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import api from '../config/api';
import socketService from '../services/socket.service';
import BackgroundShapes from '../components/BackgroundShapes';

interface Driver {
  id: number;
  nombre: string;
  licencia: string;
  telefono?: string;
  usuario_id?: number;
}

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

interface DriverStatus {
  driver: Driver;
  isOnline: boolean;
  metrics: DetectionMetrics | null;
  lastUpdate: number;
  videoFrame: string | null;
}

const LiveMonitoring = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userName, setUserName] = useState('Admin');
  const [userRole, setUserRole] = useState<string>('viewer');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverStatuses, setDriverStatuses] = useState<Map<number, DriverStatus>>(new Map());
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const creatingDriversRef = useRef<Set<number>>(new Set()); // Para evitar múltiples intentos simultáneos

  // Función helper para crear conductor automáticamente
  const createDriverForUser = async (userId: number) => {
    // Evitar múltiples intentos simultáneos para el mismo usuario
    if (creatingDriversRef.current.has(userId)) {
      return;
    }
    
    creatingDriversRef.current.add(userId);
    
    try {
      // Obtener datos del usuario
      const userResponse = await api.get(`/user/list`);
      const users = userResponse.data || [];
      const user = users.find((u: any) => u.id_usuario === userId);
      
      if (!user || user.rol !== 'driver') {
        console.warn('Usuario no encontrado o no es driver:', userId);
        return;
      }

      // Verificar si ya existe un conductor para este usuario
      const driversResponse = await api.get('/drivers');
      const existingDriver = driversResponse.data?.data?.find((d: Driver) => d.usuario_id === userId);
      
      if (existingDriver) {
        // Si ya existe, agregarlo al estado
        setDriverStatuses((prevStatuses) => {
          const newStatuses = new Map(prevStatuses);
          newStatuses.set(existingDriver.id, {
            driver: existingDriver,
            isOnline: true,
            metrics: null,
            lastUpdate: Date.now(),
            videoFrame: null,
          });
          return newStatuses;
        });
        setDrivers(prev => {
          if (prev.find(d => d.id === existingDriver.id)) return prev;
          return [...prev, existingDriver];
        });
        console.log('✅ Conductor existente agregado para userId:', userId);
        return;
      }

      // Crear conductor automáticamente
      const licenseNumber = `TEMP-${userId}-${Date.now()}`;
      const driverData = {
        license_number: licenseNumber,
        first_name: user.nombre.split(' ')[0] || user.nombre,
        last_name: user.nombre.split(' ').slice(1).join(' ') || user.apellido || '',
        date_of_birth: '1990-01-01',
        license_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usuario_id: userId,
        notes: 'Conductor creado automáticamente desde monitoreo en vivo'
      };

      const createResponse = await api.post('/drivers', driverData);
      
      if (createResponse.data?.success) {
        // Recargar lista de conductores
        const updatedDriversResponse = await api.get('/drivers');
        const updatedDrivers = updatedDriversResponse.data?.data || [];
        setDrivers(updatedDrivers);

        // Encontrar el conductor recién creado
        const newDriver = updatedDrivers.find((d: Driver) => d.usuario_id === userId);
        if (newDriver) {
          setDriverStatuses((prevStatuses) => {
            const newStatuses = new Map(prevStatuses);
            newStatuses.set(newDriver.id, {
              driver: newDriver,
              isOnline: true,
              metrics: null,
              lastUpdate: Date.now(),
              videoFrame: null,
            });
            return newStatuses;
          });
          console.log('✅ Conductor creado automáticamente para userId:', userId);
        }
      }
    } catch (error: any) {
      console.error('Error al crear conductor automáticamente:', error);
      if (error.response?.status === 403) {
        console.warn('No se tienen permisos para crear conductor. Se requiere rol admin.');
      }
    } finally {
      // Remover el userId del set después de un delay para permitir reintentos si es necesario
      setTimeout(() => {
        creatingDriversRef.current.delete(userId);
      }, 5000);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Verificar rol de administrador
    const fetchUserData = async () => {
      try {
        const response = await api.get('/user/profile');
        if (response.data) {
          setUserName(response.data.nombre);
          setUserRole(response.data.rol || 'viewer');
          setUserPhoto(response.data.foto_perfil);

          // Solo administradores pueden acceder
          if (response.data.rol !== 'admin') {
            navigate('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    // Cargar lista de conductores
    const fetchDrivers = async () => {
      try {
        const response = await api.get('/drivers');
        const driversList = response.data?.data || [];
        setDrivers(driversList);

        // Inicializar estados de conductores
        const initialStatuses = new Map<number, DriverStatus>();
        driversList.forEach((driver: Driver) => {
          initialStatuses.set(driver.id, {
            driver,
            isOnline: false,
            metrics: null,
            lastUpdate: Date.now(),
            videoFrame: null,
          });
        });
        setDriverStatuses(initialStatuses);
      } catch (error) {
        console.error('Error al cargar conductores:', error);
      }
    };

    fetchDrivers();
  }, []);

  useEffect(() => {
    // Conectar socket para recibir métricas en tiempo real
    if (userRole === 'admin') {
      socketService.connect();
      socketService.joinAlerts();

      // Escuchar métricas de detección de todos los conductores
      const handleDetectionMetrics = (data: any) => {
        console.log('📊 Métricas recibidas:', data);
        
        const userId = data.driverId || data.driver_id || data.userId;
        if (!userId) return;

        // Buscar el conductor que tiene este usuario_id
        setDriverStatuses((prevStatuses) => {
          const newStatuses = new Map(prevStatuses);
          
          // Buscar conductor por usuario_id
          let foundDriverId: number | null = null;
          newStatuses.forEach((status, driverId) => {
            if (status.driver.usuario_id === userId) {
              foundDriverId = driverId;
            }
          });
          
          // Si no se encuentra por usuario_id, intentar por driverId directamente
          if (!foundDriverId && newStatuses.has(userId)) {
            foundDriverId = userId;
          }
          
          if (foundDriverId) {
            const currentStatus = newStatuses.get(foundDriverId);
            if (currentStatus) {
              newStatuses.set(foundDriverId, {
                ...currentStatus,
                isOnline: true,
                metrics: data.metrics || data,
                lastUpdate: Date.now(),
                // Mantener el videoFrame si ya existe
                videoFrame: currentStatus.videoFrame,
              });
            }
          } else {
            console.warn('⚠️ No se encontró conductor para userId:', userId);
            // Intentar crear conductor automáticamente si el usuario tiene rol driver (fuera del setState)
            setTimeout(() => {
              createDriverForUser(userId);
            }, 0);
          }
          
          return newStatuses;
        });
      };

      // Escuchar eventos de somnolencia
      const handleDrowsinessEvent = (data: any) => {
        console.log('⚠️ Evento de somnolencia:', data);
      };

      // Escuchar frames de video
      const handleVideoFrame = (data: any) => {
        console.log('📹 Frame de video recibido:', data);
        
        const userId = data.driverId || data.driver_id || data.userId;
        if (!userId || !data.frameData) return;

        // Buscar el conductor que tiene este usuario_id
        setDriverStatuses((prevStatuses) => {
          const newStatuses = new Map(prevStatuses);
          
          // Buscar conductor por usuario_id
          let foundDriverId: number | null = null;
          newStatuses.forEach((status, driverId) => {
            if (status.driver.usuario_id === userId) {
              foundDriverId = driverId;
            }
          });
          
          // Si no se encuentra por usuario_id, intentar por driverId directamente
          if (!foundDriverId && newStatuses.has(userId)) {
            foundDriverId = userId;
          }
          
          if (foundDriverId) {
            const currentStatus = newStatuses.get(foundDriverId);
            if (currentStatus) {
              newStatuses.set(foundDriverId, {
                ...currentStatus,
                isOnline: true,
                videoFrame: data.frameData,
                lastUpdate: Date.now(),
              });
            }
          } else {
            console.warn('⚠️ No se encontró conductor para userId:', userId);
            // Intentar crear conductor automáticamente si el usuario tiene rol driver (fuera del setState)
            setTimeout(() => {
              createDriverForUser(userId);
            }, 0);
          }
          
          return newStatuses;
        });
      };

      socketService.on('detection_metrics', handleDetectionMetrics);
      socketService.on('drowsiness_event', handleDrowsinessEvent);
      socketService.on('video_frame', handleVideoFrame);

      return () => {
        socketService.off('detection_metrics', handleDetectionMetrics);
        socketService.off('drowsiness_event', handleDrowsinessEvent);
        socketService.off('video_frame', handleVideoFrame);
      };
    }
  }, [userRole]);

  useEffect(() => {
    // Verificar periódicamente el estado de los conductores
    statusCheckInterval.current = setInterval(() => {
      setDriverStatuses((prevStatuses) => {
        const newStatuses = new Map(prevStatuses);
        const now = Date.now();
        const OFFLINE_THRESHOLD = 10000; // 10 segundos sin actualización = offline

        newStatuses.forEach((status, driverId) => {
          if (now - status.lastUpdate > OFFLINE_THRESHOLD) {
            newStatuses.set(driverId, {
              ...status,
              isOnline: false,
            });
          }
        });

        return newStatuses;
      });
    }, 5000);

    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
    navigate('/login');
  };

  const getDrowsinessColor = (level: string) => {
    switch (level) {
      case 'critical':
        return '#ff1744';
      case 'high':
        return '#ff5252';
      case 'medium':
        return '#ffa726';
      case 'low':
        return '#ffeb3b';
      default:
        return '#4caf50';
    }
  };

  const getDrowsinessLabel = (level: string) => {
    switch (level) {
      case 'critical':
        return 'CRÍTICO';
      case 'high':
        return 'ALTO';
      case 'medium':
        return 'MEDIO';
      case 'low':
        return 'BAJO';
      default:
        return 'NORMAL';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', bgcolor: '#0a0e27' }}>
      <BackgroundShapes />
      
      {/* AppBar */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'rgba(10, 14, 39, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(123, 47, 247, 0.2)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <VideocamIcon sx={{ 
            mr: 1, 
            color: '#00d4ff',
            filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.6))' 
          }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 700,
              fontSize: {
                xs: '0.9rem',
                sm: '1.25rem',
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Monitoreo en Tiempo Real
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              Monitoreo
            </Box>
          </Typography>

          <Chip 
            label="ADMIN" 
            size="small"
            sx={{ 
              mr: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 700,
            }}
          />

          <IconButton color="inherit" onClick={handleMenuOpen}>
            {userPhoto ? (
              <Avatar 
                src={userPhoto} 
                alt={userName}
                sx={{ width: 40, height: 40 }}
              />
            ) : (
              <Avatar sx={{ bgcolor: '#7b2ff7', width: 40, height: 40 }}>
                <PersonIcon />
              </Avatar>
            )}
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                bgcolor: 'rgba(26, 32, 53, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(123, 47, 247, 0.3)',
                mt: 1,
              }
            }}
          >
            <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
              <PersonIcon sx={{ mr: 1 }} />
              Mi Perfil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* Estadísticas generales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              component={motion.div}
              whileHover={{ scale: 1.02 }}
              sx={{
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                cursor: 'default',
              }}
            >
              <CardContent>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                  Conductores Online
                </Typography>
                <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                  {Array.from(driverStatuses.values()).filter(s => s.isOnline).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              component={motion.div}
              whileHover={{ scale: 1.02 }}
              sx={{
                background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(245, 124, 0, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                cursor: 'default',
              }}
            >
              <CardContent>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                  Alertas Activas
                </Typography>
                <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
                  {Array.from(driverStatuses.values()).filter(s => 
                    s.isOnline && s.metrics && 
                    (s.metrics.drowsinessLevel === 'high' || s.metrics.drowsinessLevel === 'critical')
                  ).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              component={motion.div}
              whileHover={{ scale: 1.02 }}
              sx={{
                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(211, 47, 47, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                cursor: 'default',
              }}
            >
              <CardContent>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                  Estado Crítico
                </Typography>
                <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 700 }}>
                  {Array.from(driverStatuses.values()).filter(s => 
                    s.isOnline && s.metrics && s.metrics.drowsinessLevel === 'critical'
                  ).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              component={motion.div}
              whileHover={{ scale: 1.02 }}
              sx={{
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(2, 136, 209, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                cursor: 'default',
              }}
            >
              <CardContent>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                  Total Conductores
                </Typography>
                <Typography variant="h4" sx={{ color: '#00d4ff', fontWeight: 700 }}>
                  {drivers.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Lista de conductores con métricas en tiempo real */}
        <Typography 
          variant="h5" 
          sx={{ 
            color: 'white', 
            mb: { xs: 2, sm: 3 }, 
            fontWeight: 700,
            fontSize: { xs: '1rem', sm: '1.5rem', md: '1.75rem' }
          }}
        >
          Conductores Monitoreados
        </Typography>

        {drivers.length === 0 && (
          <Alert severity="info" sx={{ mb: { xs: 2, sm: 3 } }}>
            No hay conductores registrados en el sistema.
          </Alert>
        )}

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {Array.from(driverStatuses.values()).map((status) => (
            <Grid item xs={12} sm={6} md={6} lg={4} key={status.driver.id}>
              <Paper
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{
                  p: { xs: 2, sm: 2.5, md: 3 },
                  background: status.isOnline 
                    ? 'linear-gradient(135deg, rgba(26, 32, 53, 0.9) 0%, rgba(15, 20, 35, 0.9) 100%)'
                    : 'linear-gradient(135deg, rgba(26, 32, 53, 0.5) 0%, rgba(15, 20, 35, 0.5) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: status.isOnline 
                    ? `2px solid ${status.metrics ? getDrowsinessColor(status.metrics.drowsinessLevel) : '#4caf50'}`
                    : '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: status.isOnline 
                      ? `0 8px 30px ${status.metrics ? getDrowsinessColor(status.metrics.drowsinessLevel) + '40' : 'rgba(76, 175, 80, 0.3)'}`
                      : 'none',
                  },
                }}
              >
                {/* Indicador de estado */}
                <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                  <Chip
                    icon={status.isOnline ? <CheckCircleIcon /> : <WarningIcon />}
                    label={status.isOnline ? 'EN LÍNEA' : 'DESCONECTADO'}
                    size="small"
                    sx={{
                      bgcolor: status.isOnline ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)',
                      color: status.isOnline ? '#4caf50' : '#9e9e9e',
                      fontWeight: 700,
                      border: `1px solid ${status.isOnline ? '#4caf50' : '#9e9e9e'}`,
                    }}
                  />
                </Box>

                {/* Info del conductor */}
                <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 700, 
                      mb: 0.5,
                      fontSize: { xs: '0.9rem', sm: '1.25rem' }
                    }}
                  >
                    {status.driver.nombre}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Licencia: {status.driver.licencia}
                  </Typography>
                </Box>

                {/* Video en vivo */}
                {status.isOnline && status.videoFrame ? (
                  <Box sx={{ 
                    mb: 2, 
                    borderRadius: 1, 
                    overflow: 'hidden',
                    border: '2px solid rgba(0, 212, 255, 0.3)',
                    position: 'relative',
                  }}>
                    <img 
                      src={status.videoFrame} 
                      alt={`Video en vivo - ${status.driver.nombre}`}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        maxHeight: '300px',
                        objectFit: 'cover',
                        backgroundColor: 'transparent',
                      }}
                    />
                    <Box sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      bgcolor: 'rgba(0, 0, 0, 0.7)',
                      color: '#00d4ff',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      🔴 EN VIVO
                    </Box>
                  </Box>
                ) : status.isOnline ? (
                  <Box sx={{ 
                    mb: 2, 
                    p: 3, 
                    bgcolor: 'rgba(0, 212, 255, 0.1)', 
                    borderRadius: 1,
                    textAlign: 'center',
                    border: '2px dashed rgba(0, 212, 255, 0.3)',
                  }}>
                    <VideocamIcon sx={{ color: 'rgba(0, 212, 255, 0.5)', fontSize: 40, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Esperando video...
                    </Typography>
                  </Box>
                ) : null}

                {/* Métricas en tiempo real */}
                {status.isOnline && status.metrics ? (
                  <Box sx={{ mt: 2 }}>
                    {/* Nivel de somnolencia */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                        Nivel de Somnolencia
                      </Typography>
                      <Chip
                        label={getDrowsinessLabel(status.metrics.drowsinessLevel)}
                        sx={{
                          bgcolor: getDrowsinessColor(status.metrics.drowsinessLevel),
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          animation: status.metrics.drowsinessLevel === 'critical' 
                            ? 'pulse 1s infinite' 
                            : 'none',
                        }}
                      />
                    </Box>

                    {/* Indicadores */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: { xs: '0.65rem', sm: '0.75rem' }
                          }}
                        >
                          Ojos
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5,
                          color: status.metrics.eyesClosed ? '#ff1744' : '#4caf50',
                        }}>
                          <Box sx={{ 
                            width: { xs: 6, sm: 8 }, 
                            height: { xs: 6, sm: 8 }, 
                            borderRadius: '50%',
                            bgcolor: 'currentColor',
                            boxShadow: '0 0 10px currentColor',
                          }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '0.7rem', sm: '0.875rem' }
                            }}
                          >
                            {status.metrics.eyesClosed ? 'CERRADOS' : 'Abiertos'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          Boca
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5,
                          color: status.metrics.yawning ? '#ffa726' : '#4caf50',
                        }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%',
                            bgcolor: 'currentColor',
                            boxShadow: '0 0 10px currentColor',
                          }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {status.metrics.yawning ? 'BOSTEZO' : 'Normal'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Valores técnicos */}
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: 1,
                      p: 1.5,
                      bgcolor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: 1,
                    }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#00d4ff' }}>
                          EAR Promedio
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                          {status.metrics.ear.average.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#00d4ff' }}>
                          MAR
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                          {status.metrics.mar.ratio.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#4caf50' }}>
                          Confianza
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                          {(status.metrics.confidence * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          Última Act.
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                          {Math.floor((Date.now() - status.lastUpdate) / 1000)}s
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: 'rgba(158, 158, 158, 0.1)', 
                    borderRadius: 1,
                    textAlign: 'center',
                  }}>
                    <RemoveRedEyeIcon sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 40, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Sin datos de detección
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default LiveMonitoring;

