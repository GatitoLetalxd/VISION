import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import VideocamIcon from '@mui/icons-material/Videocam';
import WarningIcon from '@mui/icons-material/Warning';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import TimelineIcon from '@mui/icons-material/Timeline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import api from '../config/api';

import BackgroundShapes from '../components/BackgroundShapes';
import socketService from '../services/socket.service';

interface DashboardStats {
  activeCameras: number;
  totalDrivers: number;
  activeAlerts: number;
  eventsToday: number;
}

interface OnlineDriver {
  id: number;
  nombre: string;
  licencia: string;
  isOnline: boolean;
  lastUpdate: number;
  metrics?: {
    drowsinessLevel: string;
    eyesClosed: boolean;
    yawning: boolean;
    confidence: number;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userName, setUserName] = useState('Usuario');
  const [userRole, setUserRole] = useState<string>('viewer');
  const [stats, setStats] = useState<DashboardStats>({
    activeCameras: 0,
    totalDrivers: 0,
    activeAlerts: 0,
    eventsToday: 0,
  });
  const [onlineDrivers, setOnlineDrivers] = useState<OnlineDriver[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData && userData.nombre) {
          setUserName(userData.nombre);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }

    const fetchUserData = async () => {
      try {
        const response = await api.get('/user/profile');
        if (response.data && response.data.nombre) {
          setUserName(response.data.nombre);
          setUserRole(response.data.rol || 'viewer');
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        if (!user) {
          navigate('/login');
        }
      }
    };

    const fetchStats = async () => {
      try {
        // Obtener conductores
        const driversRes = await api.get('/drivers');
        const drivers = driversRes.data?.data || [];
        
        // Obtener eventos del día
        const today = new Date().toISOString().split('T')[0];
        const eventsRes = await api.get(`/events?fecha=${today}`);
        const events = eventsRes.data?.data || [];
        
        // Obtener alertas activas
        const alertsRes = await api.get('/alerts?estado=pending');
        const alerts = alertsRes.data?.data || [];

        setStats((prevStats) => ({
          ...prevStats,
          totalDrivers: drivers.length,
          activeAlerts: alerts.length,
          eventsToday: events.length,
        }));
      } catch (error) {
        console.error('Error al obtener estadísticas:', error);
      }
    };

    fetchUserData();
    fetchStats();

    // Actualizar estadísticas cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Socket.IO para conductores en línea
  useEffect(() => {
    socketService.connect();
    socketService.joinAlerts();

    // Escuchar métricas de detección
    const handleDetectionMetrics = (data: any) => {
      const driverId = data.driverId || data.driver_id || data.userId;
      
      setOnlineDrivers((prevDrivers) => {
        const existingIndex = prevDrivers.findIndex(d => d.id === driverId);
        const now = Date.now();
        
        let updatedDrivers;
        
        if (existingIndex >= 0) {
          // Actualizar conductor existente
          updatedDrivers = [...prevDrivers];
          updatedDrivers[existingIndex] = {
            ...updatedDrivers[existingIndex],
            isOnline: true,
            lastUpdate: now,
            metrics: data.metrics || data,
          };
        } else {
          // Agregar nuevo conductor online
          updatedDrivers = [...prevDrivers, {
            id: driverId,
            nombre: data.nombre || `Conductor ${driverId}`,
            licencia: data.licencia || 'N/A',
            isOnline: true,
            lastUpdate: now,
            metrics: data.metrics || data,
          }];
        }
        
        // Actualizar contador de cámaras activas
        setStats((prevStats) => ({
          ...prevStats,
          activeCameras: updatedDrivers.length,
        }));
        
        return updatedDrivers;
      });
    };

    socketService.on('detection_metrics', handleDetectionMetrics);

    // Verificar periódicamente conductores offline
    const checkInterval = setInterval(() => {
      setOnlineDrivers((prevDrivers) => {
        const now = Date.now();
        const OFFLINE_THRESHOLD = 10000; // 10 segundos
        
        const updatedDrivers = prevDrivers
          .map(driver => ({
            ...driver,
            isOnline: now - driver.lastUpdate < OFFLINE_THRESHOLD,
          }))
          .filter(driver => driver.isOnline); // Remover conductores offline
        
        // Actualizar contador de cámaras activas
        setStats((prevStats) => ({
          ...prevStats,
          activeCameras: updatedDrivers.length,
        }));
        
        return updatedDrivers;
      });
    }, 5000);

    return () => {
      socketService.off('detection_metrics', handleDetectionMetrics);
      clearInterval(checkInterval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 25%, #0f1419 50%, #1a1f3a 75%, #0a0e27 100%)',
        position: 'relative',
        overflow: 'hidden',
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

      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Toolbar>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.01em',
            }}
          >
            VISION-TGM
          </Typography>
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            sx={{ ml: 2 }}
          >
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40,
                background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
                boxShadow: '0 4px 15px rgba(0, 212, 255, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
              sx: {
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                color: 'white',
                '& .MuiMenuItem-root': {
                  color: 'white',
                  '&:hover': {
                    background: 'rgba(0, 212, 255, 0.1)',
                  },
                },
              },
            }}
          >
            <MenuItem onClick={() => navigate('/profile')}>
              <PersonIcon sx={{ mr: 1, color: '#00d4ff', filter: 'drop-shadow(0 0 5px rgba(0, 212, 255, 0.5))' }} />
              Mi Perfil
            </MenuItem>
            <MenuItem onClick={() => navigate('/detection')}>
              <VisibilityIcon sx={{ mr: 1, color: '#ff5252', filter: 'drop-shadow(0 0 5px rgba(255, 82, 82, 0.5))' }} />
              Detección en Vivo
            </MenuItem>
            <MenuItem onClick={() => navigate('/video-processing')}>
              <PlayCircleOutlineIcon sx={{ mr: 1, color: '#00ffea', filter: 'drop-shadow(0 0 5px rgba(0, 255, 234, 0.5))' }} />
              Procesamiento de Video
            </MenuItem>
            <MenuItem onClick={() => navigate('/drivers')}>
              <DirectionsCarIcon sx={{ mr: 1, color: '#7b2ff7', filter: 'drop-shadow(0 0 5px rgba(123, 47, 247, 0.5))' }} />
              Gestión de Conductores
            </MenuItem>
            {userRole === 'admin' && (
              <>
                <MenuItem onClick={() => navigate('/monitoring')}>
                  <VisibilityIcon sx={{ mr: 1, color: '#00d4ff', filter: 'drop-shadow(0 0 5px rgba(0, 212, 255, 0.5))' }} />
                  Monitoreo en Vivo
                </MenuItem>
                <MenuItem onClick={() => navigate('/users')}>
                  <AdminPanelSettingsIcon sx={{ mr: 1, color: '#ffa726', filter: 'drop-shadow(0 0 5px rgba(255, 167, 38, 0.5))' }} />
                  Gestión de Usuarios
                </MenuItem>
              </>
            )}
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, color: '#ff006e', filter: 'drop-shadow(0 0 5px rgba(255, 0, 110, 0.5))' }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center',
              mb: 1,
              fontWeight: 700,
              fontSize: {
                xs: '1.1rem',
                sm: '1.5rem',
                md: '2.125rem',
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Panel de Control - VISION-TGM
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              VISION-TGM
            </Box>
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              mb: 4,
            }}
          >
            Bienvenido, {userName} | Sistema de Detección de Somnolencia en Conductores
          </Typography>

          {/* Tarjetas de Estadísticas */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card sx={{
                  background: 'linear-gradient(145deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 212, 255, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: { xs: 2, sm: 3 },
                  boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2)',
                  cursor: 'pointer',
                }}>
                  <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 1.5, sm: 2 } }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        Cámaras Activas
                      </Typography>
                      <VideocamIcon sx={{ 
                        color: '#00d4ff', 
                        filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.6))',
                        fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
                      }} />
                    </Box>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        color: '#00d4ff',
                        fontWeight: 700,
                        textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                      }}
                    >
                      {stats.activeCameras}
                    </Typography>
                    <Chip 
                      label="En línea" 
                      size="small" 
                sx={{
                        mt: 1, 
                        background: 'rgba(76, 175, 80, 0.2)', 
                        color: '#4caf50',
                        border: '1px solid #4caf50',
                      }} 
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card sx={{
                  background: 'linear-gradient(145deg, rgba(123, 47, 247, 0.15) 0%, rgba(123, 47, 247, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(123, 47, 247, 0.3)',
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(123, 47, 247, 0.2)',
                      cursor: 'pointer',
                }} onClick={() => navigate('/drivers')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Conductores
                      </Typography>
                      <DirectionsCarIcon sx={{ color: '#7b2ff7', filter: 'drop-shadow(0 0 8px rgba(123, 47, 247, 0.6))' }} />
                    </Box>
                    <Typography variant="h3" sx={{ 
                      color: '#7b2ff7',
                      fontWeight: 700,
                      textShadow: '0 0 20px rgba(123, 47, 247, 0.5)',
                    }}>
                      {stats.totalDrivers}
                    </Typography>
                    <Chip 
                      label="Registrados" 
                      size="small" 
                      sx={{ 
                        mt: 1, 
                        background: 'rgba(123, 47, 247, 0.2)', 
                        color: '#7b2ff7',
                        border: '1px solid #7b2ff7',
                      }} 
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card sx={{
                  background: 'linear-gradient(145deg, rgba(255, 82, 82, 0.15) 0%, rgba(255, 82, 82, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 82, 82, 0.3)',
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(255, 82, 82, 0.2)',
                  cursor: 'pointer',
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Alertas Activas
                      </Typography>
                      <NotificationsActiveIcon sx={{ color: '#ff5252', filter: 'drop-shadow(0 0 8px rgba(255, 82, 82, 0.6))' }} />
                    </Box>
                    <Typography variant="h3" sx={{ 
                      color: '#ff5252',
                      fontWeight: 700,
                      textShadow: '0 0 20px rgba(255, 82, 82, 0.5)',
                    }}>
                      {stats.activeAlerts}
                    </Typography>
                    {stats.activeAlerts > 0 && (
                      <Chip 
                        label="¡Atención!" 
                        size="small" 
                        sx={{ 
                          mt: 1, 
                          background: 'rgba(255, 82, 82, 0.2)', 
                          color: '#ff5252',
                          border: '1px solid #ff5252',
                          animation: 'pulse 2s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.6 },
                          },
                        }} 
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card sx={{
                  background: 'linear-gradient(145deg, rgba(0, 255, 234, 0.15) 0%, rgba(0, 255, 234, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 255, 234, 0.3)',
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0, 255, 234, 0.2)',
                  cursor: 'pointer',
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Eventos Hoy
                      </Typography>
                      <TimelineIcon sx={{ color: '#00ffea', filter: 'drop-shadow(0 0 8px rgba(0, 255, 234, 0.6))' }} />
                    </Box>
                    <Typography variant="h3" sx={{ 
                      color: '#00ffea',
                      fontWeight: 700,
                      textShadow: '0 0 20px rgba(0, 255, 234, 0.5)',
                    }}>
                      {stats.eventsToday}
                    </Typography>
                    <Chip 
                      label="Detectados" 
                      size="small" 
                      sx={{ 
                        mt: 1, 
                        background: 'rgba(0, 255, 234, 0.2)', 
                        color: '#00ffea',
                        border: '1px solid #00ffea',
                      }} 
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* Sección Principal */}
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Panel de Detección en Vivo */}
            <Grid item xs={12} md={8}>
              <Paper sx={{
                p: { xs: 2, sm: 3, md: 4 },
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: { xs: 2, md: 4 },
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                minHeight: { xs: 300, md: 400 },
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <VisibilityIcon sx={{ 
                    fontSize: { xs: 50, sm: 60, md: 80 }, 
                    color: '#00d4ff',
                    filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.6))',
                    mb: { xs: 2, sm: 3 },
                  }} />
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: 'white', 
                      mb: { xs: 1.5, sm: 2 }, 
                      fontWeight: 600,
                      fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' }
                    }}
                  >
                    Detección de Somnolencia en Tiempo Real
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      mb: { xs: 3, sm: 4 },
                      fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
                      px: { xs: 1, sm: 0 }
                    }}
                  >
                    Monitorea conductores en tiempo real con análisis de video basado en IA
                    </Typography>
                  <Button
                      component={motion.button}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255, 82, 82, 0.6)' }}
                      whileTap={{ scale: 0.95 }}
                      variant="contained"
                    size="large"
                    fullWidth={isMobile}
                    startIcon={<CameraAltIcon />}
                    onClick={() => navigate('/detection')}
                      sx={{
                      background: 'linear-gradient(135deg, #ff5252 0%, #ff006e 100%)',
                        color: 'white',
                        textTransform: 'none',
                      fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' },
                      fontWeight: 600,
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 3, sm: 5 },
                      boxShadow: '0 8px 25px rgba(255, 82, 82, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      minHeight: { xs: '44px', sm: 'auto' },
                    }}
                  >
                    Iniciar Detección en Vivo
                    </Button>
                  </Box>
              </Paper>
            </Grid>

            {/* Panel Lateral */}
            <Grid item xs={12} md={4}>
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {/* Procesamiento de Video */}
                <Grid item xs={12}>
                  <Paper sx={{
                    p: { xs: 2, sm: 2.5, md: 3 },
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 255, 234, 0.2)',
                    borderRadius: { xs: 2, md: 4 },
                      cursor: 'pointer',
                    transition: 'all 0.3s ease',
                      '&:hover': {
                      background: 'linear-gradient(145deg, rgba(0, 255, 234, 0.08) 0%, rgba(0, 255, 234, 0.03) 100%)',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0, 255, 234, 0.3)',
                      },
                  }} onClick={() => navigate('/video-processing')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
                      <PlayCircleOutlineIcon sx={{ 
                        color: '#00ffea', 
                        filter: 'drop-shadow(0 0 8px rgba(0, 255, 234, 0.6))', 
                        mr: 1, 
                        fontSize: { xs: 24, sm: 28, md: 32 }
                      }} />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'white',
                          fontSize: { xs: '0.9rem', sm: '1.25rem' }
                        }}
                      >
                        Procesamiento
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        mb: { xs: 1.5, sm: 2 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      Analiza videos grabados con IA - Análisis Detallado (Nivel 2)
                    </Typography>
                    <Button 
                      variant="outlined" 
                      fullWidth
                      sx={{
                        borderColor: '#00ffea',
                        color: '#00ffea',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        padding: { xs: '6px 16px', sm: '8px 22px' },
                        minHeight: { xs: '44px', sm: 'auto' },
                        '&:hover': {
                          borderColor: '#00ffea',
                          background: 'rgba(0, 255, 234, 0.1)',
                        },
                      }}
                    >
                      Abrir
                    </Button>
                  </Paper>
                </Grid>

                {/* Monitoreo en Vivo - Solo Administradores */}
                {userRole === 'admin' && (
                <Grid item xs={12}>
                    <Paper sx={{
                      p: 3,
                      background: 'linear-gradient(145deg, rgba(0, 212, 255, 0.08) 0%, rgba(0, 212, 255, 0.03) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '2px solid rgba(0, 212, 255, 0.3)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        background: 'linear-gradient(145deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 212, 255, 0.08) 100%)',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 40px rgba(0, 212, 255, 0.4)',
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #00d4ff, #00ffea)',
                      },
                    }} onClick={() => navigate('/monitoring')}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <VisibilityIcon sx={{ color: '#00d4ff', filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.8))', mr: 1, fontSize: 32 }} />
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                            Monitoreo en Tiempo Real
                          </Typography>
                        </Box>
                        <Chip 
                          label="ADMIN" 
                          size="small"
                          sx={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                        Visualiza en tiempo real las métricas de somnolencia de todos los conductores activos
                      </Typography>
                      <Button 
                        variant="outlined" 
                        fullWidth
                        startIcon={<VideocamIcon />}
                        sx={{
                          borderColor: '#00d4ff',
                          color: '#00d4ff',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: '#00d4ff',
                            background: 'rgba(0, 212, 255, 0.15)',
                          },
                        }}
                      >
                        Abrir Monitoreo
                      </Button>
                  </Paper>
                </Grid>
                )}

                {/* Gestión de Conductores */}
                <Grid item xs={12}>
                  <Paper sx={{
                    p: 3,
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(123, 47, 247, 0.2)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(145deg, rgba(123, 47, 247, 0.08) 0%, rgba(123, 47, 247, 0.03) 100%)',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(123, 47, 247, 0.3)',
                    },
                  }} onClick={() => navigate('/drivers')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <DirectionsCarIcon sx={{ color: '#7b2ff7', filter: 'drop-shadow(0 0 8px rgba(123, 47, 247, 0.6))', mr: 1, fontSize: 32 }} />
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        Conductores
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                      Administra conductores, vehículos y perfiles
                    </Typography>
                    <Button 
                      variant="outlined" 
                      fullWidth
                      sx={{ 
                        borderColor: '#7b2ff7',
                        color: '#7b2ff7',
                        '&:hover': {
                          borderColor: '#7b2ff7',
                          background: 'rgba(123, 47, 247, 0.1)',
                        },
                      }}
                    >
                      Gestionar
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Conductores en Línea */}
          <Paper sx={{
            p: 3,
            mt: 3,
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsCarIcon sx={{ 
                  color: '#00d4ff', 
                  filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.6))', 
                  mr: 2, 
                  fontSize: 32 
                }} />
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                  Conductores en Línea
                </Typography>
              </Box>
              <Chip 
                label={`${onlineDrivers.length} Activos`}
                icon={<VisibilityIcon />}
                sx={{ 
                  background: onlineDrivers.length > 0 
                    ? 'rgba(76, 175, 80, 0.2)' 
                    : 'rgba(158, 158, 158, 0.2)', 
                  color: onlineDrivers.length > 0 ? '#4caf50' : '#9e9e9e',
                  border: `1px solid ${onlineDrivers.length > 0 ? '#4caf50' : '#9e9e9e'}`,
                  fontWeight: 600,
                }} 
              />
            </Box>
            <Grid container spacing={2}>
              {onlineDrivers.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 6,
                    px: 2,
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 2,
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                  }}>
                    <DirectionsCarIcon sx={{ 
                      fontSize: 64, 
                      color: 'rgba(255, 255, 255, 0.2)', 
                      mb: 2 
                    }} />
                    <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1 }}>
                      No hay conductores en línea
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                      Los conductores aparecerán aquí cuando inicien la detección de somnolencia
                    </Typography>
                  </Box>
                </Grid>
              ) : (
                onlineDrivers.slice(0, 3).map((driver) => {
                  const getDrowsinessColor = (level?: string) => {
                    switch (level) {
                      case 'critical': return '#ff1744';
                      case 'high': return '#ff5252';
                      case 'medium': return '#ffa726';
                      case 'low': return '#ffeb3b';
                      default: return '#4caf50';
                    }
                  };

                  const getDrowsinessLabel = (level?: string) => {
                    switch (level) {
                      case 'critical': return 'CRÍTICO';
                      case 'high': return 'ALTO';
                      case 'medium': return 'MEDIO';
                      case 'low': return 'BAJO';
                      default: return 'NORMAL';
                    }
                  };

                  return (
                    <Grid item xs={12} md={4} key={driver.id}>
                      <Card 
                        component={motion.div}
                        whileHover={{ scale: 1.02 }}
                        sx={{
                          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                          backdropFilter: 'blur(10px)',
                          border: `2px solid ${driver.metrics ? getDrowsinessColor(driver.metrics.drowsinessLevel) : 'rgba(0, 212, 255, 0.3)'}`,
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 24px ${driver.metrics ? getDrowsinessColor(driver.metrics.drowsinessLevel) + '40' : 'rgba(0, 212, 255, 0.3)'}`,
                          },
                        }}
                        onClick={() => userRole === 'admin' && navigate('/monitoring')}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700 }}>
                                {driver.nombre}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Lic: {driver.licencia}
                              </Typography>
                            </Box>
                            <Chip 
                              label="EN VIVO"
                              size="small"
                              icon={<VideocamIcon />}
                              sx={{ 
                                background: 'rgba(76, 175, 80, 0.2)', 
                                color: '#4caf50',
                                border: '1px solid #4caf50',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                animation: 'pulse 2s infinite',
                              }} 
                            />
                          </Box>

                          {driver.metrics && (
                            <>
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                  Nivel de Somnolencia
                                </Typography>
                                <Chip 
                                  label={getDrowsinessLabel(driver.metrics.drowsinessLevel)}
                                  size="small"
                                  sx={{
                                    mt: 0.5,
                                    bgcolor: getDrowsinessColor(driver.metrics.drowsinessLevel),
                                    color: 'white',
                                    fontWeight: 700,
                                    width: '100%',
                                  }}
                                />
                              </Box>

                              <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: 1,
                                p: 1,
                                bgcolor: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: 1,
                                mb: 2,
                              }}>
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                    👁️ Ojos
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    color: driver.metrics.eyesClosed ? '#ff5252' : '#4caf50',
                                    fontWeight: 600,
                                  }}>
                                    {driver.metrics.eyesClosed ? 'Cerrados' : 'Abiertos'}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                    😊 Boca
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    color: driver.metrics.yawning ? '#ffa726' : '#4caf50',
                                    fontWeight: 600,
                                  }}>
                                    {driver.metrics.yawning ? 'Bostezo' : 'Normal'}
                                  </Typography>
                                </Box>
                              </Box>

                              <LinearProgress 
                                variant="determinate" 
                                value={driver.metrics.confidence * 100}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: '#00d4ff',
                                    borderRadius: 3,
                                  },
                                }}
                              />
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
                                Confianza: {(driver.metrics.confidence * 100).toFixed(0)}%
                              </Typography>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })
              )}
            </Grid>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Dashboard; 