/**
 * Selector de modelo de deteccion
 * Permite al usuario elegir entre face-api.js (JavaScript) y MediaPipe (Python)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import { detectionModelService } from '../services/detectionModel.service';
import type { DetectionModel, DetectionModelType } from '../types/detectionModel.types';

interface DetectionModelSelectorProps {
  selectedModel: DetectionModelType;
  onModelChange: (model: DetectionModelType) => void;
  showDetails?: boolean;
}

export const DetectionModelSelector: React.FC<DetectionModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  showDetails = true
}) => {
  const [models, setModels] = useState<DetectionModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const availableModels = await detectionModelService.getAvailableModels();
      setModels(availableModels);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar modelos');
      console.error('Error cargando modelos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newModel = event.target.value as DetectionModelType;
    onModelChange(newModel);
    
    // Guardar preferencia en backend (async, no esperamos)
    detectionModelService.updateUserPreference(newModel).catch(console.error);
    
    // Guardar en localStorage
    detectionModelService.savePreferredModelLocally(newModel);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const getModelDetails = (modelName: DetectionModelType) => {
    return models.find(m => m.model_name === modelName);
  };

  return (
    <Box>
      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
          Modelo de Deteccion
        </FormLabel>
        
        <RadioGroup
          value={selectedModel}
          onChange={handleChange}
        >
          {models.map((model) => (
            <Card 
              key={model.model_name}
              variant="outlined" 
              sx={{ 
                mb: 2,
                border: selectedModel === model.model_name ? 2 : 1,
                borderColor: selectedModel === model.model_name ? 'primary.main' : 'divider',
                backgroundColor: selectedModel === model.model_name ? 'action.selected' : 'background.paper'
              }}
            >
              <CardContent>
                <FormControlLabel
                  value={model.model_name}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {model.display_name}
                        {selectedModel === model.model_name && (
                          <Chip 
                            label="Seleccionado" 
                            color="primary" 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {model.description}
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', m: 0 }}
                />

                {showDetails && selectedModel === model.model_name && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Procesamiento
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {model.processing_location === 'client' ? 'Navegador' : 'Servidor'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Landmarks
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {model.landmarks_count} puntos
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Latencia
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          ~{model.avg_latency_ms}ms
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          GPU
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {model.requires_gpu ? 'Requerida' : 'Opcional'}
                        </Typography>
                      </Grid>
                    </Grid>

                    {model.processing_location === 'server' && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Este modelo procesa en servidor. Los frames de video se envian al backend para analisis.
                      </Alert>
                    )}

                    {model.processing_location === 'client' && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        Este modelo procesa localmente en tu navegador. Privacidad total (GDPR compliant).
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </FormControl>

      <Alert severity="warning" sx={{ mt: 2 }}>
        Cambiar el modelo de deteccion reiniciara cualquier sesion activa. Los ajustes se guardaran automaticamente.
      </Alert>
    </Box>
  );
};

export default DetectionModelSelector;

