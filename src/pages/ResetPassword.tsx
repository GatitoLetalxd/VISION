import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { motion } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../config/api';

const validationSchema = Yup.object({
  contraseña: Yup.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La contraseña es requerida'),
  confirmarContraseña: Yup.string()
    .oneOf([Yup.ref('contraseña')], 'Las contraseñas no coinciden')
    .required('Confirma tu contraseña'),
});

// Componente para las figuras de fondo
const BackgroundShapes = () => (
  <>
    <Box
      component={motion.div}
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "linear"
      }}
      sx={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #2196f3 30%, transparent 90%)',
        opacity: 0.1,
        filter: 'blur(40px)',
      }}
    />
    <Box
      component={motion.div}
      animate={{
        scale: [1, 1.3, 1],
        rotate: [360, 180, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }}
      sx={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #21CBF3 30%, transparent 90%)',
        opacity: 0.1,
        filter: 'blur(40px)',
      }}
    />
  </>
);

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      contraseña: '',
      confirmarContraseña: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError('');
        await api.post('/auth/reset-password', {
          token,
          contraseña: values.contraseña,
        });
        setSuccess(true);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al restablecer la contraseña');
      }
    },
  });

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #0a1929 0%, #132f4c 100%)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <BackgroundShapes />
        
        <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
          <Paper
            elevation={6}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'white',
                textAlign: 'center',
                mb: 3
              }}
            >
              ¡Contraseña restablecida!
            </Typography>
            <Typography 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                mb: 3
              }}
            >
              Tu contraseña ha sido actualizada correctamente.
            </Typography>
            <Button
              onClick={() => navigate('/login')}
              variant="contained"
              sx={{
                mt: 2,
                background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                color: 'white',
              }}
            >
              Ir al inicio de sesión
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #0a1929 0%, #132f4c 100%)',
        overflow: 'hidden',
        position: 'relative',
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
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
            }}
          >
            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                mb: 3,
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                fontWeight: 500
              }}
            >
              Restablecer Contraseña
            </Typography>

            <Typography 
              sx={{ 
                mb: 3,
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center'
              }}
            >
              Ingresa tu nueva contraseña.
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
                id="contraseña"
                name="contraseña"
                label="Nueva contraseña"
                type={showPassword ? 'text' : 'password'}
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
                sx={{
                  '& label': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& label.Mui-focused': { color: '#2196f3' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#2196f3' },
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#ff5252',
                  },
                }}
              />

              <TextField
                margin="normal"
                fullWidth
                id="confirmarContraseña"
                name="confirmarContraseña"
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
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
                sx={{
                  '& label': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& label.Mui-focused': { color: '#2196f3' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#2196f3' },
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#ff5252',
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976d2 30%, #1cb5e0 90%)',
                  },
                }}
              >
                Restablecer Contraseña
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ResetPassword; 