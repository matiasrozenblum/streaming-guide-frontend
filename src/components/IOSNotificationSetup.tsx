'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Alert,
} from '@mui/material';
import {
  Share,
  AddToHomeScreen,
  Notifications,
  CheckCircle,
} from '@mui/icons-material';
import { usePush } from '@/contexts/PushContext';
import { useTooltip } from '@/contexts/TooltipContext';

interface IOSNotificationSetupProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function IOSNotificationSetup({ 
  open, 
  onClose, 
  onComplete 
}: IOSNotificationSetupProps) {
  const { isIOSDevice, isPWAInstalled, notificationPermission } = usePush();
  const { closeTooltip } = useTooltip();

  // Close all tooltips when this modal opens
  React.useEffect(() => {
    if (open) {
      closeTooltip();
    }
  }, [open, closeTooltip]);
  
  const steps = [
    {
      label: 'Añadir a pantalla de inicio',
      description: 'Para recibir notificaciones en iOS, primero debes instalar la app',
      icon: <AddToHomeScreen />,
      completed: isPWAInstalled,
      instructions: [
        'Toca el botón de compartir (📤) en la parte inferior de Safari',
        'Desplázate hacia abajo en el menú que aparece',
        'Selecciona "Añadir a pantalla de inicio"',
        'Toca "Añadir" en la parte superior derecha',
        'La app aparecerá en tu pantalla de inicio'
      ]
    },
    {
      label: 'Permitir notificaciones',
      description: 'Después de instalar, abre la app desde tu pantalla de inicio',
      icon: <Notifications />,
      completed: notificationPermission === 'granted',
      instructions: [
        'Abre la app desde tu pantalla de inicio (no desde Safari)',
        'Cuando aparezca el mensaje, selecciona "Permitir notificaciones"',
        'Si no aparece el mensaje, ve a Configuración > Notificaciones',
        'Busca "La Guía del Streaming" y activa las notificaciones'
      ]
    }
  ];

  const allStepsCompleted = steps.every(step => step.completed);
  const activeStep = steps.findIndex(step => !step.completed);

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  if (!isIOSDevice) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { m: 2 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Share color="primary" />
          <Typography variant="h6">
            Configurar notificaciones en iOS
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {allStepsCompleted ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle />
              <Typography>
                ¡Perfecto! Ya tienes todo configurado para recibir notificaciones.
              </Typography>
            </Box>
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            iOS Safari requiere estos pasos para habilitar las notificaciones push.
          </Alert>
        )}

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step) => (
            <Step key={step.label} completed={step.completed}>
              <StepLabel
                StepIconComponent={({ completed }) => (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: completed ? 'success.main' : 'primary.main',
                      color: 'white',
                    }}
                  >
                    {completed ? <CheckCircle /> : step.icon}
                  </Box>
                )}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {step.label}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {step.description}
                </Typography>
              </StepLabel>
              
              <StepContent>
                                 <Paper sx={{ p: 2, bgcolor: 'primary.main', mt: 1 }}>
                   <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                     Instrucciones:
                   </Typography>
                   <Box component="ol" sx={{ pl: 2, m: 0 }}>
                     {step.instructions.map((instruction, idx) => (
                       <Typography 
                         key={idx}
                         component="li" 
                         variant="body2" 
                         sx={{ mb: 0.5, color: 'text.primary' }}
                       >
                         {instruction}
                       </Typography>
                     ))}
                   </Box>
                 </Paper>

                {step.completed && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    ✅ Este paso está completado
                  </Alert>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {allStepsCompleted && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.dark' }}>
              🎉 ¡Todo listo!
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'success.dark' }}>
              Ahora puedes suscribirte a tus programas favoritos y recibirás notificaciones 
              10 minutos antes de que comiencen.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          {allStepsCompleted ? 'Cerrar' : 'Cancelar'}
        </Button>
        {allStepsCompleted && (
          <Button onClick={handleComplete} variant="contained">
            Continuar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 