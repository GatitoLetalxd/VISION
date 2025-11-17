import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  IconButton,
  Divider,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudUpload as CloudUploadIcon,
  VideoFile as VideoFileIcon,
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import api from '../config/api';
import BackgroundShapes from '../components/BackgroundShapes';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VideoAnalysis {
  id: string;
  duration: number;
  totalFrames: number;
  processedFrames: number;
  events: DrowsinessEvent[];
  metrics: VideoMetrics;
  timeline: TimelineData[];
  status?: 'processing' | 'completed' | 'failed';
  completedAt?: string;
}

interface AnalysisMetadata {
  fileName: string;
  uploadedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

interface DrowsinessEvent {
  timestamp: number;
  type: 'eyes_closed' | 'yawning' | 'critical';
  duration: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ear?: number;
  mar?: number;
  frameNumber: number;
}

interface VideoMetrics {
  averageEAR: number;
  averageMAR: number;
  totalEyesClosedEvents: number;
  totalYawningEvents: number;
  criticalMoments: number;
  drowsinessScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  eyesClosedDuration: number; // segundos
  yawningFrequency: number; // eventos por hora
}

interface TimelineData {
  time: number; // segundos
  ear: number;
  mar: number;
  drowsinessLevel: number; // 0-4
}

const VideoProcessing = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userName, setUserName] = useState('Usuario');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMeta, setAnalysisMeta] = useState<AnalysisMetadata | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        setUserName(userData.nombre || 'Usuario');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
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
    navigate('/login');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Por favor selecciona un archivo de video válido');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Por favor selecciona un archivo de video válido');
    }
  };

  const clearPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startAnalysisPolling = (videoId: string, fileName?: string) => {
    const poll = async () => {
      try {
        const response = await api.get(`/video/analysis/${videoId}`);
        const data = response.data;

        if (typeof data.progress === 'number') {
          setAnalysisProgress(data.progress);
        }

        setAnalysisMeta((prev) => {
          const baseMeta = prev || {
            fileName: fileName || data.fileName || 'Video analizado',
            uploadedAt: new Date().toISOString(),
            startedAt: null,
            completedAt: null,
          };

          return {
            ...baseMeta,
            fileName: baseMeta.fileName || fileName || data.fileName || 'Video analizado',
            startedAt: data.startedAt ?? baseMeta.startedAt ?? null,
            completedAt: data.completedAt ?? baseMeta.completedAt ?? null,
          };
        });

        if (data.status === 'completed' && data.result) {
          clearPolling();
          setAnalysisStatus('completed');
          setAnalysisProgress(100);
          setAnalysis(data.result);
          setIsProcessing(false);
          setShowResults(true);
        } else if (data.status === 'failed') {
          clearPolling();
          setAnalysisStatus('failed');
          setIsProcessing(false);
          setError(data.error || 'El análisis falló. Intenta nuevamente.');
        } else {
          setAnalysisStatus('processing');
        }
      } catch (pollError) {
        console.error('Error consultando el estado del análisis:', pollError);
      }
    };

    poll();
    clearPolling();
    pollingRef.current = setInterval(poll, 3000);
  };

  const processVideo = async () => {
    if (!selectedFile) return;

    clearPolling();
    setIsProcessing(true);
    setError('');
    setAnalysis(null);
    setShowResults(false);
    setAnalysisStatus('processing');
    setAnalysisProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);

      const uploadResponse = await api.post('/video/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const videoId = uploadResponse.data.videoId;
      setCurrentVideoId(videoId);
      setAnalysisMeta({
        fileName: selectedFile.name,
        uploadedAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
      });

      await api.post('/video/analyze', {
        videoId,
        analysisLevel: 2,
      });

      startAnalysisPolling(videoId, selectedFile.name);
    } catch (err: any) {
      console.error('Error procesando video:', err);
      clearPolling();
      setError(err.response?.data?.message || 'Error al procesar el video');
      setIsProcessing(false);
      setAnalysisStatus('failed');
      setAnalysisProgress(0);
    }
  };

  const handleReset = () => {
    clearPolling();
    setIsProcessing(false);
    setAnalysisStatus('idle');
    setAnalysisProgress(0);
    setAnalysis(null);
    setShowResults(false);
    setError('');
    setSelectedFile(null);
    setCurrentVideoId(null);
    setAnalysisMeta(null);
  };

  const handleDownloadReport = () => {
    if (!analysis) {
      return;
    }

    const payload = {
      metadata: analysisMeta,
      analysis,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analisis-somnolencia-${analysis.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getChartData = () => {
    if (!analysis?.timeline) return null;

    return {
      labels: analysis.timeline.map(d => `${Math.floor(d.time / 60)}:${String(d.time % 60).padStart(2, '0')}`),
      datasets: [
        {
          label: 'EAR (Eye Aspect Ratio)',
          data: analysis.timeline.map(d => d.ear),
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'MAR (Mouth Aspect Ratio)',
          data: analysis.timeline.map(d => d.mar),
          borderColor: '#00ffea',
          backgroundColor: 'rgba(0, 255, 234, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Nivel de Somnolencia',
          data: analysis.timeline.map(d => d.drowsinessLevel),
          borderColor: '#ff5252',
          backgroundColor: 'rgba(255, 82, 82, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
        },
      },
      title: {
        display: true,
        text: 'Timeline de Métricas de Somnolencia',
        color: '#ffffff',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#ffffff',
        },
      },
    },
  };

  const chartData = getChartData();
  const highestDrowsinessLevel = analysis?.timeline?.length
    ? Math.max(...analysis.timeline.map((item) => item.drowsinessLevel))
    : 0;
  const criticalEvent = analysis?.events?.find((event) => event.severity === 'critical');
  const totalEvents = analysis?.events?.length ?? 0;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return '#ff1744';
      case 'high': return '#ff5252';
      case 'medium': return '#ffa726';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const formatDuration = (seconds: number) => {
    const totalSeconds = Math.max(0, Math.round(seconds));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) {
      return 'No disponible';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return 'No disponible';
    }
    return date.toLocaleString();
  };

  const getSeverityColor = (severity: DrowsinessEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return '#ff1744';
      case 'high':
        return '#ff6f00';
      case 'medium':
        return '#ffa726';
      default:
        return '#4caf50';
    }
  };

  const getEventLabel = (type: DrowsinessEvent['type']) => {
    switch (type) {
      case 'eyes_closed':
        return 'Ojos Cerrados';
      case 'yawning':
        return 'Bostezo';
      case 'critical':
        return 'Crítico';
      default:
        return 'Evento';
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
          
          <VideoFileIcon sx={{ 
            mr: 1, 
            color: '#7b2ff7',
            filter: 'drop-shadow(0 0 8px rgba(123, 47, 247, 0.6))' 
          }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Procesamiento de Video - Análisis Detallado
          </Typography>

          <IconButton color="inherit" onClick={handleMenuOpen}>
            <Avatar sx={{ bgcolor: '#7b2ff7', width: 40, height: 40 }}>
              <PersonIcon />
            </Avatar>
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
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {!showResults ? (
          <>
            {/* Área de carga de video */}
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{
                p: 4,
                mb: 3,
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                backdropFilter: 'blur(20px)',
                border: isDragging ? '2px dashed #7b2ff7' : '2px dashed rgba(123, 47, 247, 0.3)',
                borderRadius: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#7b2ff7',
                  transform: 'translateY(-4px)',
                },
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              {!selectedFile ? (
                <Box>
                  <CloudUploadIcon sx={{ 
                    fontSize: 80, 
                    color: '#7b2ff7', 
                    mb: 2,
                    filter: 'drop-shadow(0 0 20px rgba(123, 47, 247, 0.6))',
                  }} />
                  <Typography variant="h5" sx={{ color: 'white', mb: 1, fontWeight: 700 }}>
                    Arrastra tu video aquí
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                    o haz clic para seleccionar un archivo
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    Formatos soportados: MP4, AVI, MOV, WebM
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <VideoFileIcon sx={{ 
                    fontSize: 80, 
                    color: '#4caf50', 
                    mb: 2,
                    filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.6))',
                  }} />
                  <Typography variant="h6" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                    Tamaño: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        processVideo();
                      }}
                      disabled={isProcessing}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        },
                      }}
                    >
                      Iniciar Análisis
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      disabled={isProcessing}
                      sx={{
                        borderColor: '#ff5252',
                        color: '#ff5252',
                        '&:hover': {
                          borderColor: '#ff5252',
                          background: 'rgba(255, 82, 82, 0.1)',
                        },
                      }}
                    >
                      Cancelar
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Progreso de procesamiento */}
            {isProcessing && (
              <Paper
                component={motion.div}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                sx={{
                  p: 4,
                  background: 'linear-gradient(145deg, rgba(123, 47, 247, 0.1) 0%, rgba(123, 47, 247, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(123, 47, 247, 0.3)',
                  borderRadius: 4,
                }}
              >
                <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
                  Procesando Video...
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={analysisProgress}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    mb: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    },
                  }}
                />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {Math.round(analysisProgress)}% completado
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mt: 1 }}>
                  Analizando frames, detectando rostros y calculando métricas...
                </Typography>
              </Paper>
            )}

            {/* Información sobre el análisis */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Card sx={{
                  background: 'linear-gradient(145deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                }}>
                  <CardContent>
                    <TimelineIcon sx={{ color: '#00d4ff', fontSize: 40, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
                      Timeline Interactivo
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Visualiza métricas EAR/MAR a lo largo del video con gráficos detallados
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{
                  background: 'linear-gradient(145deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                }}>
                  <CardContent>
                    <WarningIcon sx={{ color: '#ff9800', fontSize: 40, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
                      Detección de Eventos
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Identifica momentos críticos con timestamps precisos y niveles de severidad
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{
                  background: 'linear-gradient(145deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                }}>
                  <CardContent>
                    <AssessmentIcon sx={{ color: '#4caf50', fontSize: 40, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
                      Estadísticas Avanzadas
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Análisis completo con promedios, frecuencias y score de somnolencia
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        ) : (
          analysis ? (
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{ mt: 2 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                    Resultados del análisis
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.75)', mb: 0.5 }}>
                    Archivo: <strong>{analysisMeta?.fileName ?? 'No disponible'}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Inicio: {formatDateTime(analysisMeta?.startedAt)} · Fin: {formatDateTime(analysisMeta?.completedAt)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
                    Duración analizada: {formatDuration(Math.round(analysis.duration))} · Puntos en timeline: {analysis.timeline.length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Riesgo: ${analysis.metrics.riskLevel.toUpperCase()}`}
                    sx={{
                      backgroundColor: getRiskColor(analysis.metrics.riskLevel),
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    label={`Score ${analysis.metrics.drowsinessScore}/100`}
                    icon={<AssessmentIcon sx={{ color: '#fff !important' }} />}
                    sx={{
                      backgroundColor: 'rgba(123, 47, 247, 0.4)',
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadReport}
                    sx={{
                      borderColor: '#7b2ff7',
                      color: '#7b2ff7',
                      '&:hover': {
                        borderColor: '#7b2ff7',
                        backgroundColor: 'rgba(123, 47, 247, 0.1)',
                      },
                    }}
                  >
                    Descargar reporte
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleReset}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      },
                    }}
                  >
                    Nuevo análisis
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Paper
                    sx={{
                      p: 3,
                      height: '100%',
                      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
                      Resumen general
                    </Typography>
                    <Typography variant="h3" sx={{ color: '#7b2ff7', fontWeight: 700, mb: 1 }}>
                      {analysis.metrics.drowsinessScore}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                      Score de somnolencia (0-100)
                    </Typography>
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', my: 2 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      • Duración del video: {formatDuration(Math.round(analysis.duration))}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      • Frames totales: {analysis.totalFrames.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      • Frames analizados: {analysis.processedFrames.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper
                    sx={{
                      p: 3,
                      height: '100%',
                      background: 'linear-gradient(145deg, rgba(0, 212, 255, 0.12) 0%, rgba(0, 212, 255, 0.04) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0, 212, 255, 0.25)',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
                      Biométricas
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#00d4ff', fontWeight: 700, mb: 1 }}>
                      EAR promedio: {analysis.metrics.averageEAR.toFixed(3)}
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#00ffea', fontWeight: 700, mb: 2 }}>
                      MAR promedio: {analysis.metrics.averageMAR.toFixed(3)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      • Tiempo ojos cerrados: {analysis.metrics.eyesClosedDuration.toFixed(1)} s
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      • Nivel máximo en timeline: {highestDrowsinessLevel}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper
                    sx={{
                      p: 3,
                      height: '100%',
                      background: 'linear-gradient(145deg, rgba(255, 82, 82, 0.12) 0%, rgba(255, 82, 82, 0.04) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 82, 82, 0.25)',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
                      Eventos detectados
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      • Ojos cerrados: {analysis.metrics.totalEyesClosedEvents}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      • Bostezos: {analysis.metrics.totalYawningEvents}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      • Criticos: {analysis.metrics.criticalMoments}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      • Frecuencia de bostezos: {analysis.metrics.yawningFrequency.toFixed(2)} /h
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Paper
                sx={{
                  p: 3,
                  background: 'linear-gradient(145deg, rgba(123, 47, 247, 0.12) 0%, rgba(123, 47, 247, 0.04) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(123, 47, 247, 0.25)',
                }}
              >
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                  Timeline de métricas
                </Typography>
                <Box sx={{ height: 320 }}>
                  {chartData ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', mt: 4 }}>
                      No se registraron datos suficientes para el timeline.
                    </Typography>
                  )}
                </Box>
              </Paper>

              <Grid container spacing={3} sx={{ mt: 3 }}>
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      height: '100%',
                      background: 'linear-gradient(145deg, rgba(255, 152, 0, 0.12) 0%, rgba(255, 152, 0, 0.04) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 152, 0, 0.25)',
                    }}
                  >
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                      Eventos relevantes ({totalEvents})
                    </Typography>
                    {analysis.events.length ? (
                      <List dense sx={{ maxHeight: 320, overflowY: 'auto' }}>
                        {analysis.events.slice(0, 8).map((event, index) => (
                          <ListItem key={`${event.type}-${event.timestamp}-${index}`} alignItems="flex-start">
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <WarningIcon sx={{ color: getSeverityColor(event.severity) }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                                  {getEventLabel(event.type)} · {formatDuration(event.timestamp)}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                  Duración: {event.duration.toFixed(2)} s · Severidad: {event.severity.toUpperCase()}
                                  {event.ear ? ` · EAR: ${event.ear.toFixed(3)}` : ''}
                                  {event.mar ? ` · MAR: ${event.mar.toFixed(3)}` : ''}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                        {analysis.events.length > 8 && (
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 1, display: 'block', textAlign: 'center' }}>
                            +{analysis.events.length - 8} eventos adicionales
                          </Typography>
                        )}
                      </List>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        No se detectaron eventos de somnolencia en el video analizado.
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      height: '100%',
                      background: 'linear-gradient(145deg, rgba(76, 175, 80, 0.12) 0%, rgba(76, 175, 80, 0.04) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(76, 175, 80, 0.25)',
                    }}
                  >
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                      Observaciones automáticas
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <CheckCircleIcon sx={{ color: analysis.metrics.drowsinessScore >= 50 ? '#ff5252' : '#4caf50' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                              Nivel de riesgo general
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              El puntaje indica un riesgo {analysis.metrics.riskLevel === 'low' ? 'bajo' : analysis.metrics.riskLevel} de somnolencia.
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <TimelineIcon sx={{ color: '#00d4ff' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                              Punto más crítico
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              {criticalEvent
                                ? `Evento ${getEventLabel(criticalEvent.type)} en ${formatDuration(criticalEvent.timestamp)} con severidad ${criticalEvent.severity.toUpperCase()}`
                                : 'No se registraron eventos críticos.'}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <VisibilityIcon sx={{ color: '#00ffea' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                              Recomendación
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              {analysis.metrics.drowsinessScore >= 75
                                ? 'Se recomienda detener el vehículo y descansar inmediatamente.'
                                : analysis.metrics.drowsinessScore >= 50
                                ? 'Se sugiere tomar un descanso supervisado y repetir el análisis.'
                                : 'Continúa monitoreando periódicamente para mantener la seguridad.'}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                No hay resultados disponibles
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Sube un video y ejecuta un análisis para visualizar los resultados detallados.
              </Typography>
            </Box>
          )
        )}
      </Container>
    </Box>
  );
};

export default VideoProcessing;

