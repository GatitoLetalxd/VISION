import { Box } from '@mui/material';
import { motion } from 'framer-motion';

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

export default BackgroundShapes;

