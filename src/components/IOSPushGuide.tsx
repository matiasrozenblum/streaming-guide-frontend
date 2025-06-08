'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Alert,
  Collapse,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  AddToHomeScreen,
  Notifications,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  Phone,
  NotificationsActive,
} from '@mui/icons-material';
import { usePush } from '@/contexts/PushContext';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function IOSPushGuide() {
  const { isIOSDevice, isPWAInstalled, notificationPermission } = usePush();
  const { mode } = useThemeContext();
  const [expanded, setExpanded] = useState(false);

  if (!isIOSDevice) {
    return null;
  }

  const steps = [
    {
      label: 'Añadir a pantalla de inicio',
      icon: <AddToHomeScreen />,
      completed: isPWAInstalled,
      description: 'Instala la app en tu iPhone para recibir notificaciones',
      instructions: [
        'Toca el botón compartir (📤) abajo en Safari',
        'Busca "Añadir a pantalla de inicio"',
        'Toca "Añadir" y ¡listo!'
      ]
    },
    {
      label: 'Activar notificaciones',
      icon: <Notifications />,
      completed: notificationPermission === 'granted',
      description: 'Permite las notificaciones desde la app instalada',
      instructions: [
        'Abre la app desde tu pantalla de inicio',
        'Acepta las notificaciones cuando aparezca el mensaje',
        '¡Ya recibirás alertas de tus programas!'
      ]
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;
  const allComplete = completedSteps === steps.length;

  return (
    <Card 
      sx={{ 
        mb: 3,
        background: mode === 'light'
          ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)'
          : 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
        border: '1px solid',
        borderColor: mode === 'light' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(33, 150, 243, 0.2)',
      }}
    >
      <CardContent sx={{ pb: expanded ? 3 : 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Phone color="primary" sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={600}>
                📱 Notificaciones push en iOS
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {allComplete 
                  ? '¡Perfecto! Ya recibes notificaciones push' 
                  : `${completedSteps} de ${steps.length} pasos completados`
                }
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            {allComplete ? (
              <Chip 
                icon={<CheckCircle />} 
                label="Configurado" 
                color="success" 
                variant="outlined"
              />
            ) : (
              <Chip 
                icon={<NotificationsActive />} 
                label="Configurar" 
                color="primary" 
                variant="outlined"
              />
            )}
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {!allComplete && (
          <Box sx={{ mt: 2, mb: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                }
              }} 
            />
          </Box>
        )}

        <Collapse in={expanded}>
          {allComplete ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                ¡Excelente! Ya tienes todo configurado para recibir notificaciones push 
                instantáneas de tus programas favoritos.
              </Typography>
            </Alert>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Actualmente recibes notificaciones por email. Para recibir notificaciones 
                  push instantáneas, sigue estos sencillos pasos:
                </Typography>
              </Alert>
              
                             <Stepper orientation="vertical" sx={{ mt: 2 }}>
                 {steps.map((step) => (
                  <Step key={step.label} active={!step.completed} completed={step.completed}>
                    <StepLabel
                      StepIconComponent={({ completed, active }) => (
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: completed 
                              ? 'success.main' 
                              : active 
                                ? 'primary.main'
                                : 'grey.300',
                            color: 'white',
                          }}
                        >
                          {completed ? <CheckCircle fontSize="small" /> : step.icon}
                        </Box>
                      )}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {step.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </StepLabel>
                    
                    {!step.completed && (
                      <StepContent>
                        <Box sx={{ ml: 1, mt: 1 }}>
                          {step.instructions.map((instruction, idx) => (
                            <Typography 
                              key={idx}
                              variant="body2" 
                              sx={{ 
                                mb: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Box 
                                sx={{ 
                                  width: 6, 
                                  height: 6, 
                                  borderRadius: '50%', 
                                  bgcolor: 'primary.main',
                                  flexShrink: 0,
                                }} 
                              />
                              {instruction}
                            </Typography>
                          ))}
                        </Box>
                      </StepContent>
                    )}
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
} 