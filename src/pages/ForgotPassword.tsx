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
} from '@mui/material';
import { motion } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../config/api';

const validationSchema = Yup.object({
  correo: Yup.string()
    .email('Ingresa un correo electrónico válido')
    .required('El correo es requerido'),
});

import BackgroundShapes from '../components/BackgroundShapes';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      correo: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError('');
        await api.post('/auth/forgot-password', values);
        setSuccess(true);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al procesar la solicitud');
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
          background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 25%, #0f1419 50%, #1a1f3a 75%, #0a0e27 100%)',
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
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
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
              ¡Correo enviado!
            </Typography>
            <Typography 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                mb: 3
              }}
            >
              Se ha enviado un enlace para restablecer tu contraseña al correo proporcionado.
              Por favor, revisa tu bandeja de entrada.
            </Typography>
            <Button
              component={motion.button}
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(0, 212, 255, 0.6)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/login'}
              variant="contained"
              sx={{
                mt: 2,
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
              Volver al inicio de sesión
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
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 25%, #0f1419 50%, #1a1f3a 75%, #0a0e27 100%)',
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
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
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
              Recuperar Contraseña
            </Typography>

            <Typography 
              sx={{ 
                mb: 3,
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center'
              }}
            >
              Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
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
                id="correo"
                name="correo"
                label="Correo electrónico"
                value={formik.values.correo}
                onChange={formik.handleChange}
                error={formik.touched.correo && Boolean(formik.errors.correo)}
                helperText={formik.touched.correo && formik.errors.correo}
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
                }}
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
                Enviar instrucciones
              </Button>

              <Button
                component={Link}
                to="/login"
                fullWidth
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  '&:hover': {
                    color: '#00ffea',
                    textShadow: '0 0 10px rgba(0, 255, 234, 0.5)',
                  },
                }}
              >
                Volver al inicio de sesión
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ForgotPassword; 