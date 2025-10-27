import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { motion } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../config/api';

const validationSchema = Yup.object({
  nombre: Yup.string()
    .required('El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: Yup.string()
    .required('El apellido es requerido')
    .min(2, 'El apellido debe tener al menos 2 caracteres'),
  correo: Yup.string()
    .email('Ingresa un correo electrónico válido')
    .required('El correo es requerido'),
  contraseña: Yup.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La contraseña es requerida'),
  confirmarContraseña: Yup.string()
    .oneOf([Yup.ref('contraseña')], 'Las contraseñas no coinciden')
    .required('Confirma tu contraseña'),
});

import BackgroundShapes from '../components/BackgroundShapes';

const Register = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      nombre: '',
      apellido: '',
      correo: '',
      contraseña: '',
      confirmarContraseña: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError('');
        // Usar /signup en lugar de /register para evitar bloqueo de AdBlockers
        const response = await api.post('/auth/signup', {
          nombre: values.nombre,
          apellido: values.apellido,
          correo: values.correo,
          contraseña: values.contraseña,
        });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al registrar usuario');
      }
    },
  });

  const textFieldStyles = {
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
      color: 'rgba(255, 255, 255, 0.8)',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#00d4ff',
    },
    '& .MuiInputBase-input': {
      color: 'white',
    },
    '& .MuiFormHelperText-root': {
      color: '#ff5252',
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 25%, #0f1419 50%, #1a1f3a 75%, #0a0e27 100%)',
        overflow: 'hidden',
        position: 'relative',
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
      
      <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={6}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: '0 8px 25px rgba(0, 212, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                <PersonAddIcon sx={{ color: 'white', fontSize: 28 }} />
              </Box>
            </motion.div>

            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                mb: 3,
                background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 700,
                textShadow: 'none',
              }}
            >
              Registro
            </Typography>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  severity="error" 
                  sx={{ 
                    mt: 1, 
                    mb: 2, 
                    width: '100%',
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    color: '#ff5252',
                    '& .MuiAlert-icon': {
                      color: '#ff5252'
                    }
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}

            <Box 
              component="form" 
              onSubmit={formik.handleSubmit} 
              sx={{ width: '100%' }}
            >
              <TextField
                margin="normal"
                fullWidth
                id="nombre"
                name="nombre"
                label="Nombre"
                autoComplete="given-name"
                autoFocus
                value={formik.values.nombre}
                onChange={formik.handleChange}
                error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                helperText={formik.touched.nombre && formik.errors.nombre}
                sx={textFieldStyles}
              />

              <TextField
                margin="normal"
                fullWidth
                id="apellido"
                name="apellido"
                label="Apellido"
                autoComplete="family-name"
                value={formik.values.apellido}
                onChange={formik.handleChange}
                error={formik.touched.apellido && Boolean(formik.errors.apellido)}
                helperText={formik.touched.apellido && formik.errors.apellido}
                sx={textFieldStyles}
              />

              <TextField
                margin="normal"
                fullWidth
                id="correo"
                name="correo"
                label="Correo Electrónico"
                autoComplete="email"
                value={formik.values.correo}
                onChange={formik.handleChange}
                error={formik.touched.correo && Boolean(formik.errors.correo)}
                helperText={formik.touched.correo && formik.errors.correo}
                sx={textFieldStyles}
              />

              <TextField
                margin="normal"
                fullWidth
                id="contraseña"
                name="contraseña"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formik.values.contraseña}
                onChange={formik.handleChange}
                error={formik.touched.contraseña && Boolean(formik.errors.contraseña)}
                helperText={formik.touched.contraseña && formik.errors.contraseña}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyles}
              />

              <TextField
                margin="normal"
                fullWidth
                id="confirmarContraseña"
                name="confirmarContraseña"
                label="Confirmar Contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formik.values.confirmarContraseña}
                onChange={formik.handleChange}
                error={formik.touched.confirmarContraseña && Boolean(formik.errors.confirmarContraseña)}
                helperText={formik.touched.confirmarContraseña && formik.errors.confirmarContraseña}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyles}
              />

              <Button
                component={motion.button}
                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(0, 212, 255, 0.6)' }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
                  color: 'white',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  boxShadow: '0 8px 25px rgba(0, 212, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                    transition: 'left 0.5s ease',
                  },
                  '&:hover::before': {
                    left: '100%',
                  },
                }}
              >
                Registrarse
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link 
                  to="/login" 
                  style={{ 
                    textDecoration: 'none',
                  }}
                >
                  <Typography 
                    variant="body1"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        color: '#00ffea',
                        textShadow: '0 0 10px rgba(0, 255, 234, 0.5)',
                      },
                    }}
                  >
                    ¿Ya tienes una cuenta? Inicia sesión
                  </Typography>
                </Link>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Register; 