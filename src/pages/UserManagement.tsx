import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Switch,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  RemoveRedEye as ViewerIcon,
  Settings as OperatorIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  DirectionsCar as DriverIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api, { SERVER_URL } from '../config/api';

interface User {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: 'admin' | 'operator' | 'viewer';
  activo: boolean;
  ultimo_acceso: string | null;
  fecha_registro: string;
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/user/list');
      setUsers(response.data);
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      setError(error.response?.data?.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string, userName: string) => {
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      console.log('Cambiando rol:', { userId, newRole, userName });
      const response = await api.put(`/user/${userId}/role`, { role: newRole });
      console.log('Respuesta del servidor:', response.data);
      setSuccess(`Rol de ${userName} actualizado a ${getRoleLabel(newRole)}`);
      
      // Pequeño delay para asegurar que la base de datos se actualice
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Recargar usuarios para reflejar el cambio
      await loadUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cambiar rol';
      setError(errorMessage);
      console.error('Error al cambiar rol:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
        userId,
        newRole
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean, userName: string) => {
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put(`/user/${userId}/status`, { is_active: !currentStatus });
      setSuccess(`Usuario ${userName} ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
      loadUsers();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setDeleteDialog({ open: true, user });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.user) return;

    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/user/${deleteDialog.user.id_usuario}`);
      setSuccess(`Usuario ${deleteDialog.user.nombre} ${deleteDialog.user.apellido} eliminado correctamente`);
      setDeleteDialog({ open: false, user: null });
      loadUsers();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al eliminar usuario');
      setDeleteDialog({ open: false, user: null });
    } finally {
      setUpdating(false);
    }
  };

  const getRoleColor = (role: string): 'error' | 'warning' | 'info' | 'success' => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'operator':
        return 'warning';
      case 'viewer':
        return 'info';
      case 'driver':
        return 'success';
      default:
        return 'info';
    }
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'operator':
        return 'Operador';
      case 'viewer':
        return 'Visualizador';
      case 'driver':
        return 'Conductor';
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <AdminIcon />;
      case 'operator':
        return <OperatorIcon />;
      case 'viewer':
        return <ViewerIcon />;
      case 'driver':
        return <DriverIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1419 100%)',
        pb: 4,
      }}
    >
      {/* AppBar con gradiente */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(123, 47, 247, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
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
          <AdminIcon sx={{ mr: 2, color: '#00d4ff' }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
            }}
          >
            Gestión de Usuarios
          </Typography>
          <Tooltip title="Recargar">
            <span>
              <IconButton color="inherit" onClick={loadUsers} disabled={loading || updating}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* Alertas */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
              {error}
            </Alert>
          </motion.div>
        )}

        {success && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
              {success}
            </Alert>
          </motion.div>
        )}

        {/* Estadísticas rápidas */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{ flex: 1 }}
          >
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(145deg, rgba(255, 82, 82, 0.1) 0%, rgba(255, 82, 82, 0.05) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 82, 82, 0.3)',
                borderRadius: 3,
                textAlign: 'center',
              }}
            >
              <AdminIcon sx={{ fontSize: 40, color: '#ff5252', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#ff5252', fontWeight: 700 }}>
                {users.filter((u) => u.rol === 'admin').length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Administradores
              </Typography>
            </Paper>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{ flex: 1 }}
          >
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(145deg, rgba(255, 167, 38, 0.1) 0%, rgba(255, 167, 38, 0.05) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 167, 38, 0.3)',
                borderRadius: 3,
                textAlign: 'center',
              }}
            >
              <OperatorIcon sx={{ fontSize: 40, color: '#ffa726', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#ffa726', fontWeight: 700 }}>
                {users.filter((u) => u.rol === 'operator').length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Operadores
              </Typography>
            </Paper>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            style={{ flex: 1 }}
          >
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(145deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: 3,
                textAlign: 'center',
              }}
            >
              <ViewerIcon sx={{ fontSize: 40, color: '#00d4ff', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#00d4ff', fontWeight: 700 }}>
                {users.filter((u) => u.rol === 'viewer').length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Visualizadores
              </Typography>
            </Paper>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            style={{ flex: 1 }}
          >
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(145deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                borderRadius: 3,
                textAlign: 'center',
              }}
            >
              <DriverIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                {users.filter((u) => u.rol === 'driver').length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Conductores
              </Typography>
            </Paper>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            style={{ flex: 1 }}
          >
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(145deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                borderRadius: 3,
                textAlign: 'center',
              }}
            >
              <PersonIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                {users.filter((u) => u.activo).length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Activos
              </Typography>
            </Paper>
          </motion.div>
        </Box>

        {/* Tabla de usuarios */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <TableContainer
            component={Paper}
            elevation={3}
            sx={{
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(123, 47, 247, 0.1) 100%)',
                  }}
                >
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700 }}>Usuario</TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700 }}>Rol</TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700 }}>Último Acceso</TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <CircularProgress sx={{ color: '#00d4ff' }} />
                      <Typography sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                        Cargando usuarios...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        No hay usuarios registrados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, index) => (
                    <motion.tr
                      key={user.id_usuario}
                      component={TableRow}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      sx={{
                        '&:hover': {
                          background: 'rgba(0, 212, 255, 0.05)',
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
                              width: 40,
                              height: 40,
                            }}
                          >
                            {getInitials(user.nombre, user.apellido)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ color: 'white', fontWeight: 600 }}>
                              {user.nombre} {user.apellido}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              ID: {user.id_usuario}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>{user.correo}</Typography>
                      </TableCell>

                      <TableCell>
                        <Select
                          value={user.rol}
                          onChange={(e) =>
                            handleRoleChange(user.id_usuario, e.target.value, `${user.nombre} ${user.apellido}`)
                          }
                          disabled={updating}
                          size="small"
                          startAdornment={getRoleIcon(user.rol)}
                          sx={{
                            color: 'white',
                            minWidth: 160,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: `${getRoleColor(user.rol) === 'error' ? '#ff5252' : getRoleColor(user.rol) === 'warning' ? '#ffa726' : '#00d4ff'}`,
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: `${getRoleColor(user.rol) === 'error' ? '#ff1744' : getRoleColor(user.rol) === 'warning' ? '#ff9800' : '#00b8d4'}`,
                            },
                            '& .MuiSelect-icon': {
                              color: 'white',
                            },
                          }}
                        >
                          <MenuItem value="admin">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AdminIcon sx={{ color: '#ff5252' }} />
                              Administrador
                            </Box>
                          </MenuItem>
                          <MenuItem value="operator">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <OperatorIcon sx={{ color: '#ffa726' }} />
                              Operador
                            </Box>
                          </MenuItem>
                          <MenuItem value="viewer">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ViewerIcon sx={{ color: '#00d4ff' }} />
                              Visualizador
                            </Box>
                          </MenuItem>
                          <MenuItem value="driver">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DriverIcon sx={{ color: '#4caf50' }} />
                              Conductor
                            </Box>
                          </MenuItem>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Switch
                            checked={user.activo}
                            onChange={() =>
                              handleToggleStatus(user.id_usuario, user.activo, `${user.nombre} ${user.apellido}`)
                            }
                            disabled={updating}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#4caf50',
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#4caf50',
                              },
                            }}
                          />
                          <Chip
                            label={user.activo ? 'Activo' : 'Inactivo'}
                            color={user.activo ? 'success' : 'default'}
                            size="small"
                            sx={{
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: user.ultimo_acceso ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)',
                          }}
                        >
                          {formatDate(user.ultimo_acceso)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Tooltip title="Eliminar usuario">
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteClick(user)}
                              disabled={updating}
                              sx={{
                                '&:hover': {
                                  background: 'rgba(255, 82, 82, 0.1)',
                                },
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>
      </Container>

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null })}
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, rgba(26, 31, 58, 0.98) 0%, rgba(15, 20, 25, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 82, 82, 0.3)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: '#ff5252' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon />
            Confirmar Eliminación
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'white', mb: 2 }}>
            ¿Estás seguro de que deseas eliminar al usuario{' '}
            <strong>
              {deleteDialog.user?.nombre} {deleteDialog.user?.apellido}
            </strong>
            ?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer. El usuario será marcado como eliminado.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, user: null })}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={updating}
          >
            {updating ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;

