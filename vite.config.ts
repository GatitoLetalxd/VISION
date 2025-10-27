import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Optimizaciones de build
  build: {
    target: 'esnext', // Código moderno para mejor rendimiento
    minify: 'esbuild', // Minificación rápida con esbuild
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar librerías grandes en chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
          'vendor-face': ['face-api.js'],
          'vendor-framer': ['framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Aumentar límite de advertencia
  },
  
  // Optimizaciones de desarrollo
  optimizeDeps: {
    include: ['face-api.js', '@mui/material', '@mui/icons-material', 'framer-motion'],
  },
  
  server: {
    host: '0.0.0.0', // Permite acceso desde cualquier IP
    port: 5175,
    strictPort: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '.cert/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '.cert/cert.pem')),
    },
  },
  preview: {
    host: '0.0.0.0', // Para el modo preview también
    port: 5175,
    strictPort: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '.cert/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '.cert/cert.pem')),
    },
  }
})
