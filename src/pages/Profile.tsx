import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Grid,
  TextField,
  Button,
  Alert,
  IconButton,
  CircularProgress,
  Snackbar,
  Tooltip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import LockIcon from '@mui/icons-material/Lock';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SendIcon from '@mui/icons-material/Send';
import api, { SERVER_URL } from '../config/api';
import FriendsManager from '../components/FriendsManager';

type UserRole = 'usuario' | 'admin' | 'superadmin';

interface UserData {
  id: number;
  nombre: string;
  correo: string;
  rol: UserRole;
  foto_perfil?: string;
  fecha_registro?: string;
}

// Interfaz para las solicitudes de admin
interface AdminRequest {
  id_solicitud: number;
  usuario_id: number;
  nombre: string;
  correo: string;
  razon: string;
  fecha_solicitud: string;
}

import BackgroundShapes from '../components/BackgroundShapes';

// Función auxiliar para verificar el rol
const hasRole = (userRole: string | undefined, role: UserRole): boolean => {
  return userRole === role;
};

// Función auxiliar para verificar si es admin o superadmin
const isAdminOrSuperadmin = (userRole: string | undefined): boolean => {
  return userRole === 'admin' || userRole === 'superadmin';
};

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editData, setEditData] = useState<Partial<UserData>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [openAdminRequest, setOpenAdminRequest] = useState(false);
  const [adminRequestReason, setAdminRequestReason] = useState('');
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);
  const [showAdminRequests, setShowAdminRequests] = useState(false);
  const [adminList, setAdminList] = useState<Array<{id_usuario: number, nombre: string, correo: string, fecha_registro: string}>>([]);
  const [usersList, setUsersList] = useState<Array<{id_usuario: number, nombre: string, correo: string, rol: string}>>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/user/profile');
        const userData = {
          ...response.data,
          foto_perfil: response.data.foto_perfil ? `${SERVER_URL}${response.data.foto_perfil}` : null
        };
        setUserData(userData);
        setEditData(userData);
        console.log('Datos del perfil cargados:', userData);
      } catch (error: any) {
        console.error('Error al cargar el perfil:', error);
        setError('Error al cargar los datos del perfil');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar los 2MB');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/user/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = `${SERVER_URL}${response.data.foto_url}`;
      setUserData(prev => prev ? { ...prev, foto_perfil: imageUrl } : null);
      setSuccess('Foto de perfil actualizada correctamente');
      console.log('Foto actualizada:', imageUrl);
    } catch (err: any) {
      console.error('Error al subir la foto:', err);
      setError(err.response?.data?.message || 'Error al actualizar la foto de perfil');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await api.put('/user/profile', editData);
      setUserData(prev => prev ? { ...prev, ...editData } : null);
      setIsEditing(false);
      setSuccess('Perfil actualizado correctamente');
    } catch (error) {
      setError('Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePasswordChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
    }

    try {
      await api.put('/user/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccess('Contraseña actualizada correctamente');
      setShowPasswordFields(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setError('Error al actualizar la contraseña');
    }
  };

  const handleAdminRequest = async () => {
    try {
      if (!adminRequestReason.trim()) {
        setError('Por favor, ingresa una razón para tu solicitud');
        return;
      }

      if (adminRequestReason.trim().length < 10) {
        setError('La razón debe tener al menos 10 caracteres');
        return;
      }
      
      await api.post('/admin/request', { reason: adminRequestReason.trim() });
      setSuccess('Solicitud enviada correctamente');
      setOpenAdminRequest(false);
      setAdminRequestReason('');
    } catch (error: any) {
      console.error('Error al enviar solicitud:', error);
      setError(error.response?.data?.message || 'Error al enviar la solicitud');
    }
  };

  // Función para cargar las solicitudes pendientes
  const fetchAdminRequests = async () => {
    try {
      const response = await api.get('/admin/pending');
      console.log('Respuesta de solicitudes admin:', response.data);
      setAdminRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      setAdminRequests([]);
    }
  };

  // Función para cargar la lista de administradores
  const fetchAdminList = async () => {
    if (hasRole(userData?.rol, 'superadmin')) {
      try {
        const response = await api.get('/admin/list');
        setAdminList(response.data);
      } catch (error) {
        console.error('Error al cargar lista de administradores:', error);
      }
    }
  };

  // Cargar solicitudes y lista de admins cuando cambia el rol
  useEffect(() => {
    if (isAdminOrSuperadmin(userData?.rol)) {
      fetchAdminRequests();
    }
    if (hasRole(userData?.rol, 'superadmin')) {
      fetchAdminList();
    }
  }, [userData?.rol]);

  // Función para remover un administrador
  const handleRemoveAdmin = async (adminId: number) => {
    try {
      await api.delete(`/admin/remove/${adminId}`);
      setSuccess('Administrador removido correctamente');
      fetchAdminList(); // Actualizar la lista
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al remover administrador');
    }
  };

  // Función para manejar las solicitudes
  const handleRequestAction = async (requestId: number, action: 'aprobada' | 'rechazada') => {
    try {
      await api.put('/admin/handle', { requestId, action });
      setSuccess(`Solicitud ${action} correctamente`);
      fetchAdminRequests(); // Recargar la lista
    } catch (error) {
      setError('Error al procesar la solicitud');
    }
  };

  // Agregar función para obtener la lista de usuarios
  const fetchUsersList = async () => {
    if (isAdminOrSuperadmin(userData?.rol)) {
      try {
        const response = await api.get('/user/list');
        setUsersList(response.data);
      } catch (error) {
        console.error('Error al cargar lista de usuarios:', error);
      }
    }
  };

  // Agregar useEffect para cargar usuarios
  useEffect(() => {
    if (isAdminOrSuperadmin(userData?.rol)) {
      fetchUsersList();
    }
  }, [userData?.rol]);

  // Agregar función para renderizar la sección de usuarios
  const renderUsersSection = () => {
    if (isAdminOrSuperadmin(userData?.rol)) {
      return (
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    borderRadius: 4,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                    mb: 3
                  }}
        >
            <Typography
              variant="h6"
              sx={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 600,
              }}
            >
            <PersonIcon /> Gestión de Usuarios
          </Typography>
          
          <List sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: 1,
            maxHeight: '300px',
            overflow: 'auto'
          }}>
            {usersList.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No hay usuarios registrados"
                  sx={{ color: 'white' }}
                />
              </ListItem>
            ) : (
              usersList.map((user) => (
                <ListItem key={user.id_usuario}>
                  <ListItemText
                    primary={
                      <Typography component="span" color="white">
                        {user.nombre}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography component="span" color="rgba(255, 255, 255, 0.7)" variant="body2">
                          {user.correo}
                        </Typography>
                        <Typography 
                          component="span"
                          color="rgba(255, 255, 255, 0.7)" 
                          variant="body2"
                          sx={{
                            display: 'inline-block',
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            mt: 0.5
                          }}
                        >
                          {user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </Paper>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          width: '100%',
          background: 'linear-gradient(to bottom right, #0a1929 0%, #132f4c 100%)',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Renderizar sección de solicitudes de admin
  const renderAdminRequestsSection = () => {
    if (isAdminOrSuperadmin(userData?.rol)) {
      return (
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    borderRadius: 4,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                    mb: 3
                  }}
        >
            <Typography
              variant="h6"
              sx={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 600,
              }}
            >
            <AdminPanelSettingsIcon /> Solicitudes de Administrador
          </Typography>
          
          <List sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
            {!Array.isArray(adminRequests) || adminRequests.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary="No hay solicitudes pendientes"
                  sx={{ color: 'white' }}
                />
              </ListItem>
            ) : (
              adminRequests.map((request) => (
                <ListItem key={request.id_solicitud}>
                  <ListItemText
                    primary={
                      <Typography color="white">
                        {request.nombre} ({request.correo})
                      </Typography>
                    }
                    secondary={
                      <Typography color="rgba(255, 255, 255, 0.7)" variant="body2">
                        {request.razon}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Aprobar">
                      <IconButton
                        onClick={() => handleRequestAction(request.id_solicitud, 'aprobada')}
                        sx={{ color: 'success.main' }}
                      >
                        <SaveIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Rechazar">
                      <IconButton
                        onClick={() => handleRequestAction(request.id_solicitud, 'rechazada')}
                        sx={{ color: 'error.main' }}
                      >
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
        </Paper>
      );
    }
    return null;
  };

  // Renderizar sección de gestión de administradores (superadmin)
  const renderAdminManagementSection = () => {
    if (hasRole(userData?.rol, 'superadmin')) {
      return (
        <Paper
          elevation={3}
          sx={{
            p: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2
          }}
        >
            <Typography
              variant="h6"
              sx={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 600,
              }}
            >
            <BadgeIcon /> Gestión de Administradores
          </Typography>
          
          <List sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
            {adminList.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No hay administradores registrados"
                  sx={{ color: 'white' }}
                />
              </ListItem>
            ) : (
              adminList.map((admin) => (
                <ListItem key={admin.id_usuario}>
                  <ListItemText
                    primary={
                      <Typography color="white">
                        {admin.nombre} ({admin.correo})
                      </Typography>
                    }
                    secondary={
                      <Typography color="rgba(255, 255, 255, 0.7)" variant="body2">
                        Registrado: {formatDate(admin.fecha_registro)}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Remover administrador">
                      <IconButton
                        onClick={() => handleRemoveAdmin(admin.id_usuario)}
                        sx={{ color: 'error.main' }}
                      >
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
        </Paper>
      );
    }
    return null;
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

      <Container maxWidth={hasRole(userData?.rol, 'superadmin') ? "lg" : "md"} sx={{ position: 'relative', zIndex: 1 }}>
        {hasRole(userData?.rol, 'superadmin') ? (
          // Layout para superadmin (dos columnas)
          <Grid container spacing={4} alignItems="flex-start">
            {/* Columna izquierda: Perfil del usuario */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Botón de retroceso */}
                <Box sx={{ mb: 3 }}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => navigate(-1)}
                      startIcon={<ArrowBackIcon />}
                      sx={{
                        color: 'white',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.1)',
                        }
                      }}
                    >
                      Volver
                    </Button>
                  </motion.div>
                </Box>

                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    borderRadius: 4,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Grid container spacing={4}>
                    <Grid item xs={12} display="flex" justifyContent="center">
                      <motion.div 
                        whileHover={{ scale: 1.05 }} 
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Box position="relative">
                          <Avatar
                            src={userData?.foto_perfil}
                            sx={{
                              width: 150,
                              height: 150,
                              border: '4px solid rgba(255, 255, 255, 0.2)',
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                              background: theme => theme.palette.primary.main,
                            }}
                          >
                            {!userData?.foto_perfil && <PersonIcon sx={{ fontSize: 80 }} />}
                          </Avatar>
                          <Tooltip title="Cambiar foto de perfil">
                            <IconButton
                              onClick={handlePhotoClick}
                              disabled={isUploading}
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                backgroundColor: 'primary.main',
                                '&:hover': {
                                  backgroundColor: 'primary.dark',
                                  transform: 'scale(1.1)',
                                },
                                transition: 'transform 0.2s',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                              }}
                            >
                              {isUploading ? (
                                <CircularProgress size={24} color="inherit" />
                              ) : (
                                <PhotoCameraIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                          <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handlePhotoChange}
                          />
                        </Box>
                      </motion.div>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography
                        variant="h4"
                        component={motion.h4}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        sx={{
                          textAlign: 'center',
                          mb: 4,
                          background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          fontWeight: 700,
                          letterSpacing: 1,
                        }}
                      >
                        {userData?.nombre}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <motion.div whileHover={{ scale: 1.02 }}>
                        <TextField
                          fullWidth
                          label="Nombre"
                          name="nombre"
                          value={isEditing ? editData.nombre : userData?.nombre}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Tu nombre"
                          InputProps={{
                            startAdornment: <BadgeIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                          }}
                          sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.3)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00d4ff',
                              boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                            },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.8) !important',
                              fontSize: '1.1rem',
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#00d4ff !important',
                            },
                            '& .MuiInputBase-input': {
                              color: 'white',
                              fontSize: '1.1rem',
                              '&::placeholder': {
                                color: 'rgba(255, 255, 255, 0.7)',
                                opacity: 1,
                              },
                            },
                          }}
                        />
                      </motion.div>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <motion.div whileHover={{ scale: 1.02 }}>
                        <TextField
                          fullWidth
                          label="Correo Electrónico"
                          name="correo"
                          value={isEditing ? editData.correo : userData?.correo}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="tu.correo@ejemplo.com"
                          InputProps={{
                            startAdornment: <EmailIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                          }}
                          sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.3)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00d4ff',
                              boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                            },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.8) !important',
                              fontSize: '1.1rem',
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#00d4ff !important',
                            },
                            '& .MuiInputBase-input': {
                              color: 'white',
                              fontSize: '1.1rem',
                              '&::placeholder': {
                                color: 'rgba(255, 255, 255, 0.7)',
                                opacity: 1,
                              },
                            },
                          }}
                        />
                      </motion.div>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ mb: 3 }}>
                        <Button
                          variant="text"
                          onClick={() => setShowPasswordFields(!showPasswordFields)}
                          startIcon={<LockIcon />}
                          sx={{
                            color: 'white',
                            mb: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          {showPasswordFields ? 'Ocultar cambio de contraseña' : 'Cambiar contraseña'}
                        </Button>

                        <Collapse in={showPasswordFields}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                type="password"
                                label="Contraseña actual"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange('currentPassword')}
                                InputProps={{
                                  startAdornment: <LockIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.3)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00d4ff',
                              boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                            },
                                  },
                                  '& .MuiInputLabel-root': {
                                    color: 'white',
                                    fontSize: '1.1rem',
                                  },
                                  '& .MuiInputBase-input': {
                                    color: 'white',
                                    fontSize: '1.1rem',
                                  },
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                type="password"
                                label="Nueva contraseña"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange('newPassword')}
                                InputProps={{
                                  startAdornment: <LockIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.3)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00d4ff',
                              boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                            },
                                  },
                                  '& .MuiInputLabel-root': {
                                    color: 'white',
                                    fontSize: '1.1rem',
                                  },
                                  '& .MuiInputBase-input': {
                                    color: 'white',
                                    fontSize: '1.1rem',
                                  },
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                type="password"
                                label="Confirmar nueva contraseña"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange('confirmPassword')}
                                error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                                helperText={
                                  passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''
                                    ? 'Las contraseñas no coinciden'
                                    : ''
                                }
                                InputProps={{
                                  startAdornment: <LockIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.3)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00d4ff',
                              boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                            },
                                  },
                                  '& .MuiInputLabel-root': {
                                    color: 'white',
                                    fontSize: '1.1rem',
                                  },
                                  '& .MuiInputBase-input': {
                                    color: 'white',
                                    fontSize: '1.1rem',
                                  },
                                  '& .MuiFormHelperText-root': {
                                    color: '#ff1744',
                                  },
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} display="flex" justifyContent="flex-end">
                              <Button
                                variant="contained"
                                onClick={handleSavePassword}
                                disabled={
                                  !passwordData.currentPassword ||
                                  !passwordData.newPassword ||
                                  !passwordData.confirmPassword ||
                                  passwordData.newPassword !== passwordData.confirmPassword
                                }
                                sx={{
                                  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                                }}
                              >
                                Guardar contraseña
                              </Button>
                            </Grid>
                          </Grid>
                        </Collapse>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <motion.div whileHover={{ scale: 1.02 }}>
                        <Box sx={{ position: 'relative' }}>
                          <TextField
                            fullWidth
                            label="Rol de Usuario"
                            value={userData?.rol}
                            disabled
                            InputProps={{
                              startAdornment: <AdminPanelSettingsIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                            }}
                            sx={{
                              mb: 3,
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  borderWidth: 2,
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.5)',
                                },
                              },
                              '& .MuiInputLabel-root': {
                                color: 'white',
                                fontSize: '1.1rem',
                              },
                              '& .MuiInputBase-input': {
                                color: 'white',
                                fontSize: '1.1rem',
                                textTransform: 'capitalize',
                              },
                            }}
                          />
                          {hasRole(userData?.rol, 'usuario') && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setOpenAdminRequest(true)}
                              startIcon={<SendIcon />}
                              sx={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                color: 'white',
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                '&:hover': {
                                  borderColor: 'white',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                              }}
                            >
                              Solicitar rol admin
                            </Button>
                          )}
                        </Box>
                      </motion.div>
                    </Grid>

                    {userData?.fecha_registro && (
                      <Grid item xs={12}>
                        <motion.div whileHover={{ scale: 1.02 }}>
                          <TextField
                            fullWidth
                            label="Fecha de Registro"
                            value={formatDate(userData.fecha_registro)}
                            disabled
                            InputProps={{
                              startAdornment: <CalendarTodayIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                            }}
                            sx={{
                              mb: 3,
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  borderWidth: 2,
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.5)',
                                },
                              },
                              '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: '1.1rem',
                              },
                              '& .MuiInputBase-input': {
                                color: 'white',
                                fontSize: '1.1rem',
                              },
                            }}
                          />
                        </motion.div>
                      </Grid>
                    )}

                    {/* Sección de Amigos */}
                    <Grid item xs={12}>
                      <Typography
                        variant="h5"
                        sx={{
                          color: 'white',
                          mb: 3,
                          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                          fontWeight: 600,
                        }}
                      >
                        Amigos
                      </Typography>
                      <FriendsManager />
                    </Grid>

                    <Grid item xs={12} display="flex" justifyContent="center" gap={2}>
                      <AnimatePresence mode="wait">
                        {!isEditing ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Button
                              component={motion.button}
                              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0, 212, 255, 0.6)' }}
                              whileTap={{ scale: 0.98 }}
                              variant="contained"
                              startIcon={<EditIcon />}
                              onClick={() => setIsEditing(true)}
                              sx={{
                                background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
                                boxShadow: '0 8px 25px rgba(0, 212, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'all 0.3s',
                              }}
                            >
                              Editar Perfil
                            </Button>
                          </motion.div>
                        ) : (
                          <>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Button
                                component={motion.button}
                                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0, 212, 255, 0.6)' }}
                                whileTap={{ scale: 0.98 }}
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                sx={{
                                  background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
                                  boxShadow: '0 8px 25px rgba(0, 212, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  transition: 'all 0.3s',
                                }}
                              >
                                Guardar
                              </Button>
                            </motion.div>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={() => {
                                  setIsEditing(false);
                                  setEditData(userData || {});
                                }}
                                sx={{
                                  borderColor: '#ff5252',
                                  color: '#ff5252',
                                  '&:hover': {
                                    borderColor: '#ff1744',
                                    backgroundColor: 'rgba(255, 23, 68, 0.04)',
                                    transform: 'scale(1.05)',
                                  },
                                  transition: 'transform 0.2s',
                                }}
                              >
                                Cancelar
                              </Button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </Grid>
                  </Grid>
                </Paper>
              </motion.div>
            </Grid>

            {/* Columna derecha: Gestión administrativa */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Botón invisible para alineación */}
                <Box sx={{ mb: 3, visibility: 'hidden' }}>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    sx={{
                      color: 'white',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.1)',
                      }
                    }}
                  >
                    Volver
                  </Button>
                </Box>
                {renderUsersSection()}
                {renderAdminRequestsSection()}
                {renderAdminManagementSection()}
              </motion.div>
            </Grid>
          </Grid>
        ) : (
          // Layout para usuarios normales y admin (una columna)
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Botón de retroceso */}
            <Box sx={{ mb: 3 }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => navigate(-1)}
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    color: 'white',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  Volver
                </Button>
              </motion.div>
            </Box>

            <Paper
              elevation={3}
              sx={{
                p: 4,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 4,
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                mb: 3
              }}
            >
              <Grid container spacing={4}>
                <Grid item xs={12} display="flex" justifyContent="center">
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Box position="relative">
                      <Avatar
                        src={userData?.foto_perfil}
                        sx={{
                          width: 150,
                          height: 150,
                          border: '4px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                          background: theme => theme.palette.primary.main,
                        }}
                      >
                        {!userData?.foto_perfil && <PersonIcon sx={{ fontSize: 80 }} />}
                      </Avatar>
                      <Tooltip title="Cambiar foto de perfil">
                        <IconButton
                          onClick={handlePhotoClick}
                          disabled={isUploading}
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            backgroundColor: 'primary.main',
                            '&:hover': {
                              backgroundColor: 'primary.dark',
                              transform: 'scale(1.1)',
                            },
                            transition: 'transform 0.2s',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                          }}
                        >
                          {isUploading ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            <PhotoCameraIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                      <input
                        type="file"
                        hidden
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </Box>
                  </motion.div>
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    variant="h4"
                    component={motion.h4}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    sx={{
                      textAlign: 'center',
                      mb: 4,
                      color: 'white',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                      fontWeight: 600,
                      letterSpacing: 1,
                    }}
                  >
                    {userData?.nombre}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <TextField
                      fullWidth
                      label="Nombre"
                      name="nombre"
                      value={isEditing ? editData.nombre : userData?.nombre}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Tu nombre"
                      InputProps={{
                        startAdornment: <BadgeIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.3)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00d4ff',
                              boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                            },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.9) !important',
                          fontSize: '1.1rem',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: 'rgba(255, 255, 255, 0.9) !important',
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                          fontSize: '1.1rem',
                          '&::placeholder': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12} md={6}>
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <TextField
                      fullWidth
                      label="Correo Electrónico"
                      name="correo"
                      value={isEditing ? editData.correo : userData?.correo}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="tu.correo@ejemplo.com"
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.3)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00d4ff',
                              boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                            },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.9) !important',
                          fontSize: '1.1rem',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: 'rgba(255, 255, 255, 0.9) !important',
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                          fontSize: '1.1rem',
                          '&::placeholder': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mb: 3 }}>
                    <Button
                      variant="text"
                      onClick={() => setShowPasswordFields(!showPasswordFields)}
                      startIcon={<LockIcon />}
                      sx={{
                        color: 'white',
                        mb: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      {showPasswordFields ? 'Ocultar cambio de contraseña' : 'Cambiar contraseña'}
                    </Button>

                    <Collapse in={showPasswordFields}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            type="password"
                            label="Contraseña actual"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange('currentPassword')}
                            InputProps={{
                              startAdornment: <LockIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.3)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00d4ff',
                              boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                            },
                              },
                              '& .MuiInputLabel-root': {
                                color: 'white',
                                fontSize: '1.1rem',
                              },
                              '& .MuiInputBase-input': {
                                color: 'white',
                                fontSize: '1.1rem',
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            type="password"
                            label="Nueva contraseña"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange('newPassword')}
                            InputProps={{
                              startAdornment: <LockIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.3)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00d4ff',
                              boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                            },
                              },
                              '& .MuiInputLabel-root': {
                                color: 'white',
                                fontSize: '1.1rem',
                              },
                              '& .MuiInputBase-input': {
                                color: 'white',
                                fontSize: '1.1rem',
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            type="password"
                            label="Confirmar nueva contraseña"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange('confirmPassword')}
                            error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                            helperText={
                              passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''
                                ? 'Las contraseñas no coinciden'
                                : ''
                            }
                            InputProps={{
                              startAdornment: <LockIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.3)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(0, 212, 255, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00d4ff',
                              boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                            },
                              },
                              '& .MuiInputLabel-root': {
                                color: 'white',
                                fontSize: '1.1rem',
                              },
                              '& .MuiInputBase-input': {
                                color: 'white',
                                fontSize: '1.1rem',
                              },
                              '& .MuiFormHelperText-root': {
                                color: '#ff1744',
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} display="flex" justifyContent="flex-end">
                          <Button
                            variant="contained"
                            onClick={handleSavePassword}
                            disabled={
                              !passwordData.currentPassword ||
                              !passwordData.newPassword ||
                              !passwordData.confirmPassword ||
                              passwordData.newPassword !== passwordData.confirmPassword
                            }
                            sx={{
                              background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
                              boxShadow: '0 8px 25px rgba(0, 212, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            Guardar contraseña
                          </Button>
                        </Grid>
                      </Grid>
                    </Collapse>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        fullWidth
                        label="Rol de Usuario"
                        value={userData?.rol}
                        disabled
                        InputProps={{
                          startAdornment: <AdminPanelSettingsIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                        }}
                        sx={{
                          mb: 3,
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'white',
                            fontSize: '1.1rem',
                          },
                          '& .MuiInputBase-input': {
                            color: 'white',
                            fontSize: '1.1rem',
                            textTransform: 'capitalize',
                          },
                        }}
                      />
                      {hasRole(userData?.rol, 'usuario') && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setOpenAdminRequest(true)}
                          startIcon={<SendIcon />}
                          sx={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            color: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            '&:hover': {
                              borderColor: 'white',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          Solicitar rol admin
                        </Button>
                      )}
                    </Box>
                  </motion.div>
                </Grid>

                {userData?.fecha_registro && (
                  <Grid item xs={12}>
                    <motion.div whileHover={{ scale: 1.02 }}>
                      <TextField
                        fullWidth
                        label="Fecha de Registro"
                        value={formatDate(userData.fecha_registro)}
                        disabled
                        InputProps={{
                          startAdornment: <CalendarTodayIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                        }}
                        sx={{
                          mb: 3,
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '1.1rem',
                          },
                          '& .MuiInputBase-input': {
                            color: 'white',
                            fontSize: '1.1rem',
                          },
                        }}
                      />
                    </motion.div>
                  </Grid>
                )}

                {/* Sección de Amigos */}
                <Grid item xs={12}>
                  <Typography
                    variant="h5"
                    sx={{
                      background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      mb: 3,
                      fontWeight: 700,
                    }}
                  >
                    Amigos
                  </Typography>
                  <FriendsManager />
                </Grid>

                <Grid item xs={12} display="flex" justifyContent="center" gap={2}>
                  <AnimatePresence mode="wait">
                    {!isEditing ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Button
                          variant="contained"
                          startIcon={<EditIcon />}
                          onClick={() => setIsEditing(true)}
                          sx={{
                            background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'scale(1.05)',
                            },
                          }}
                        >
                          Editar Perfil
                        </Button>
                      </motion.div>
                    ) : (
                      <>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            sx={{
                              background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                              transition: 'transform 0.2s',
                              '&:hover': {
                                transform: 'scale(1.05)',
                              },
                            }}
                          >
                            Guardar
                          </Button>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Button
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={() => {
                              setIsEditing(false);
                              setEditData(userData || {});
                            }}
                            sx={{
                              borderColor: '#ff5252',
                              color: '#ff5252',
                              '&:hover': {
                                borderColor: '#ff1744',
                                backgroundColor: 'rgba(255, 23, 68, 0.04)',
                                transform: 'scale(1.05)',
                              },
                              transition: 'transform 0.2s',
                            }}
                          >
                            Cancelar
                          </Button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </Grid>
              </Grid>
            </Paper>

            {/* Secciones administrativas para admin */}
            {hasRole(userData?.rol, 'admin') && (
              <>
                {renderUsersSection()}
                {renderAdminRequestsSection()}
              </>
            )}
          </motion.div>
        )}
      </Container>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2000,
            }}
          >
            <Alert 
              severity="error"
              sx={{
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success"
          sx={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            borderRadius: 2,
          }}
        >
          {success}
        </Alert>
      </Snackbar>

      {/* Admin Request Dialog */}
      <Dialog
        open={openAdminRequest}
        onClose={() => setOpenAdminRequest(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e1e !important',
            color: '#ffffff !important',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            '& .MuiDialogTitle-root': {
              color: '#ffffff !important',
              backgroundColor: '#1e1e1e !important',
            },
            '& .MuiDialogContent-root': {
              backgroundColor: '#1e1e1e !important',
              color: '#ffffff !important',
            },
            '& .MuiDialogActions-root': {
              backgroundColor: '#1e1e1e !important',
              color: '#ffffff !important',
            },
            '& .MuiTextField-root': {
              backgroundColor: '#2d2d2d !important',
              '& .MuiInputBase-root': {
                color: '#ffffff !important',
                backgroundColor: '#2d2d2d !important',
                '& .MuiInputLabel-root': {
                  color: '#cccccc !important',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#666666 !important',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#888888 !important',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2196f3 !important',
                },
              },
              '& .MuiFormHelperText-root': {
                color: '#cccccc !important',
              },
            },
          },
        }}
      >
        <DialogTitle 
          sx={{ 
            color: '#ffffff !important',
            backgroundColor: '#1e1e1e !important',
          }}
        >
          Solicitar Rol de Administrador
        </DialogTitle>
        <DialogContent 
          sx={{ 
            backgroundColor: '#1e1e1e !important',
            color: '#ffffff !important',
          }}
        >
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Razón de la solicitud"
            value={adminRequestReason}
            onChange={(e) => setAdminRequestReason(e.target.value)}
            placeholder="Explica por qué necesitas permisos de administrador..."
            error={adminRequestReason.trim().length > 0 && adminRequestReason.trim().length < 10}
            helperText={
              adminRequestReason.trim().length === 0
                ? 'Este campo es requerido'
                : adminRequestReason.trim().length < 10
                ? 'La razón debe tener al menos 10 caracteres'
                : 'Explica detalladamente por qué necesitas permisos de administrador'
            }
            sx={{ 
              mt: 2,
              '& .MuiInputBase-root': {
                color: '#ffffff !important',
                backgroundColor: '#2d2d2d !important',
              },
              '& .MuiInputLabel-root': {
                color: '#cccccc !important',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#666666 !important',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#888888 !important',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2196f3 !important',
              },
              '& .MuiFormHelperText-root': {
                color: '#cccccc !important',
              },
            }}
          />
        </DialogContent>
        <DialogActions 
          sx={{ 
            backgroundColor: '#1e1e1e !important',
            color: '#ffffff !important',
          }}
        >
          <Button 
            onClick={() => setOpenAdminRequest(false)} 
            color="inherit"
            sx={{ color: '#ffffff !important' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAdminRequest}
            variant="contained"
            disabled={!adminRequestReason.trim() || adminRequestReason.trim().length < 10}
            sx={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
              color: '#ffffff !important',
              boxShadow: '0 4px 15px rgba(0, 212, 255, 0.4)',
            }}
          >
            Enviar solicitud
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile; 