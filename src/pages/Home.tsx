import { Box, Button, Container, Typography, Paper, Grid, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import HighQualityIcon from '@mui/icons-material/HighQuality';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SpeedIcon from '@mui/icons-material/Speed';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

// Importar imágenes estáticamente para que Vite las procese correctamente
import imagen1 from '../assets/images/imagen1.jpg';
import imagen2 from '../assets/images/imagen2.jpg';
import imagen3 from '../assets/images/imagen3.jpg';
import imagen4 from '../assets/images/imagen4.jpg';
import imagen5 from '../assets/images/imagen5.jpg';
import imagen6 from '../assets/images/imagen6.jpg';

const images = [
  imagen1,
  imagen2,
  imagen3,
];

const secondaryImages = [
  imagen4,
  imagen5,
  imagen6,
];

// Componente para las figuras de fondo con efectos de brillo mejorados
const BackgroundShapes = () => (
  <>
    <Box
      component={motion.div}
      animate={{
        scale: [1, 1.3, 1],
        rotate: [0, 180, 360],
        opacity: [0.15, 0.25, 0.15],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      sx={{
        position: 'fixed',
        top: '5%',
        left: '5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, rgba(0, 212, 255, 0.1) 30%, transparent 70%)',
        filter: 'blur(60px)',
        zIndex: 0,
      }}
    />
    <Box
      component={motion.div}
      animate={{
        scale: [1, 1.4, 1],
        rotate: [360, 180, 0],
        opacity: [0.15, 0.3, 0.15],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      sx={{
        position: 'fixed',
        bottom: '5%',
        right: '5%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(123, 47, 247, 0.3) 0%, rgba(123, 47, 247, 0.1) 30%, transparent 70%)',
        filter: 'blur(60px)',
        zIndex: 0,
      }}
    />
    <Box
      component={motion.div}
      animate={{
        scale: [1, 1.2, 1],
        x: [0, 100, 0],
        y: [0, -50, 0],
        opacity: [0.1, 0.2, 0.1],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      sx={{
        position: 'fixed',
        top: '40%',
        right: '15%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 255, 234, 0.25) 0%, rgba(0, 255, 234, 0.05) 40%, transparent 70%)',
        filter: 'blur(50px)',
        zIndex: 0,
      }}
    />
  </>
);

// Componente para el segundo carrusel
const SecondCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setActiveIndex((prevIndex) => (prevIndex + newDirection + secondaryImages.length) % secondaryImages.length);
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      height: '60vh',
      width: '100%',
      overflow: 'hidden',
      bgcolor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={activeIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              width: '80%',
              height: '80%',
              position: 'relative',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            }}
          >
            <Box
              component="img"
              src={secondaryImages[activeIndex]}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.8)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                p: 3,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <Typography variant="h5" sx={{ mb: 1, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                Imagen {activeIndex + 1}
              </Typography>
              <Typography variant="body1" sx={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                Descripción de la imagen {activeIndex + 1}
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </AnimatePresence>

      <Box
        component={motion.div}
        whileHover={{ opacity: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => paginate(-1)}
        sx={{
          position: 'absolute',
          left: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
          cursor: 'pointer',
          opacity: 0.6,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(5px)',
          borderRadius: '50%',
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KeyboardArrowLeftIcon sx={{ fontSize: 40, color: 'white' }} />
      </Box>

      <Box
        component={motion.div}
        whileHover={{ opacity: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => paginate(1)}
        sx={{
          position: 'absolute',
          right: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
          cursor: 'pointer',
          opacity: 0.6,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(5px)',
          borderRadius: '50%',
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KeyboardArrowRightIcon sx={{ fontSize: 40, color: 'white' }} />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
          zIndex: 2,
        }}
      >
        {secondaryImages.map((_, index) => (
          <Box
            key={index}
            component={motion.div}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setDirection(index > activeIndex ? 1 : -1);
              setActiveIndex(index);
            }}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: index === activeIndex ? '#2196f3' : 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const containerRef = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [secondaryImageIndex, setSecondaryImageIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondaryImageIndex((prevIndex) => (prevIndex + 1) % secondaryImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 25%, #0f1419 50%, #1a1f3a 75%, #0a0e27 100%)',
        margin: 0,
        padding: 0,
        overflowX: 'hidden',
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

      {/* Hero Section con Carrusel */}
      <Box
        sx={{
          height: '98.5vh',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Carrusel de Imágenes */}
        <motion.div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            y,
            opacity,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                transition: { 
                  duration: 1,
                  ease: "easeOut"
                }
              }}
              exit={{ 
                opacity: 0,
                scale: 0.95,
                transition: { 
                  duration: 0.5,
                  ease: "easeIn"
                }
              }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backgroundImage: `url(${images[currentImageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.4)',
              }}
            />
          </AnimatePresence>
        </motion.div>

        {/* Contenido sobre el carrusel */}
        <Container
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography 
              variant="h1" 
              component="h1" 
              gutterBottom
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 30%, #7b2ff7 70%, #ff006e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textAlign: 'center',
                mb: 4,
                textShadow: 'none',
                fontSize: { xs: '3.5rem', sm: '5rem', md: '6.5rem' },
                letterSpacing: '-0.02em',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '110%',
                  height: '110%',
                  background: 'radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 70%)',
                  filter: 'blur(30px)',
                  zIndex: -1,
                  animation: 'pulse 3s ease-in-out infinite',
                },
                '@keyframes pulse': {
                  '0%, 100%': {
                    opacity: 0.5,
                    transform: 'translate(-50%, -50%) scale(1)',
                  },
                  '50%': {
                    opacity: 0.8,
                    transform: 'translate(-50%, -50%) scale(1.1)',
                  },
                },
              }}
            >
              VISION-TGM
            </Typography>
            <Typography 
              variant="h5" 
              component="h2" 
              gutterBottom 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                mb: 6,
                maxWidth: '800px',
                mx: 'auto',
                textShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
                fontSize: { xs: '1.2rem', sm: '1.5rem' },
                fontWeight: 300,
                letterSpacing: '0.5px',
                lineHeight: 1.6,
              }}
            >
              Sistema Inteligente de Detección de Somnolencia en Conductores
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                component={motion.button}
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0, 212, 255, 0.6)' }}
                whileTap={{ scale: 0.95 }}
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
                  color: 'white',
                  px: 5,
                  py: 2.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1.2rem',
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
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Comenzar Ahora
              </Button>
              <Button
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(0, 212, 255, 0.5)',
                  borderWidth: 2,
                  px: 5,
                  py: 2.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  background: 'rgba(0, 212, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#00ffea',
                    background: 'rgba(0, 212, 255, 0.15)',
                    boxShadow: '0 0 30px rgba(0, 212, 255, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Iniciar Sesión
              </Button>
            </Box>
          </motion.div>
        </Container>

        {/* Indicadores del carrusel */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '1rem',
            zIndex: 2,
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              component={motion.div}
              animate={{
                scale: currentImageIndex === index ? 1.2 : 1,
                opacity: currentImageIndex === index ? 1 : 0.5,
              }}
              sx={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </Box>
      </Box>

      {/* Segundo Carrusel */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="xl">
          <Typography 
            variant="h3" 
            component="h2" 
            align="center" 
            gutterBottom
            sx={{ 
              mb: 8,
              background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
              textShadow: 'none',
            }}
          >
            Detección en Tiempo Real
          </Typography>
          <SecondCarousel />
        </Container>
      </Box>

      {/* Sección de Características */}
      <Container sx={{ py: 8 }}>
        <Typography 
          variant="h3" 
          component="h2" 
          align="center" 
          sx={{ 
            mb: 8,
            background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            textShadow: 'none',
          }}
        >
          Características del Sistema
        </Typography>
        <Grid container spacing={4}>
          {[
            {
              icon: <HighQualityIcon sx={{ fontSize: 50, color: '#00d4ff', filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.5))' }} />,
              title: 'Detección Precisa',
              description: 'Análisis en tiempo real con alta precisión de detección de somnolencia'
            },
            {
              icon: <SpeedIcon sx={{ fontSize: 50, color: '#00ffea', filter: 'drop-shadow(0 0 10px rgba(0, 255, 234, 0.5))' }} />,
              title: 'Alertas Instantáneas',
              description: 'Notificaciones inmediatas para prevenir accidentes de tránsito'
            },
            {
              icon: <CloudUploadIcon sx={{ fontSize: 50, color: '#7b2ff7', filter: 'drop-shadow(0 0 10px rgba(123, 47, 247, 0.5))' }} />,
              title: 'Fácil Integración',
              description: 'Sistema intuitivo compatible con múltiples tipos de cámaras'
            }
          ].map((feature, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 4,
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'radial-gradient(circle at center, rgba(0, 212, 255, 0.1) 0%, transparent 70%)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    },
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 15px 40px rgba(0, 212, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(0, 212, 255, 0.5)',
                    },
                    '&:hover::before': {
                      opacity: 1,
                    },
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      color: 'white',
                      fontWeight: 600,
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      lineHeight: 1.7,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Sección de Contacto */}
      <Box sx={{ 
        py: 10, 
        background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.5) 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }
      }}>
        <Container>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              textAlign: 'center',
              mb: 8,
              background: 'linear-gradient(135deg, #00d4ff 0%, #00ffea 50%, #7b2ff7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
              textShadow: 'none',
            }}
          >
            Contáctanos
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {[
              {
                icon: <EmailIcon sx={{ fontSize: 40, color: '#00d4ff', filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.5))' }} />,
                title: 'Email',
                content: 'rmontufarm@unamad.edu.pe'
              },
              {
                icon: <PhoneIcon sx={{ fontSize: 40, color: '#00ffea', filter: 'drop-shadow(0 0 10px rgba(0, 255, 234, 0.5))' }} />,
                title: 'Teléfono',
                content: '983126035'
              },
              {
                icon: <LocationOnIcon sx={{ fontSize: 40, color: '#7b2ff7', filter: 'drop-shadow(0 0 10px rgba(123, 47, 247, 0.5))' }} />,
                title: 'Ubicación',
                content: 'Madre de Dios, Perú'
              }
            ].map((contact, index) => (
              <Grid item xs={12} sm={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: 4,
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-10px)',
                        boxShadow: '0 15px 40px rgba(0, 212, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(0, 212, 255, 0.5)',
                      },
                    }}
                  >
                    <Box sx={{ mb: 2 }}>
                      {contact.icon}
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 2, 
                        color: 'white',
                        fontWeight: 600,
                      }}
                    >
                      {contact.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)',
                        textAlign: 'center',
                      }}
                    >
                      {contact.content}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 