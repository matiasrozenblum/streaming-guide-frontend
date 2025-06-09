'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  AddToHomeScreen,
  Notifications,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  IosShare,
} from '@mui/icons-material';
import { usePush } from '@/contexts/PushContext';

export default function IOSPushGuide() {
  const { isIOSDevice, isPWAInstalled, notificationPermission } = usePush();
  const [expanded, setExpanded] = useState(false);

  if (!isIOSDevice) {
    return null;
  }

  const steps = [
    {
      label: 'Agregar a pantalla de inicio',
      icon: <AddToHomeScreen />,
      completed: isPWAInstalled,
      description: 'Instalá la app en tu iPhone para recibir notificaciones',
      instructions: [
        <span key="step1">
        Tocá el botón compartir 
          <IosShare 
            fontSize="inherit" 
            sx={{ verticalAlign: 'middle', display: 'inline-block' }} 
          />
          abajo en Safari
      </span>,
        'Buscá "Agregar a inicio"',
        'Tocá "Agregar" y ¡listo!'
      ]
    },
    {
      label: 'Activar notificaciones',
      icon: <Notifications />,
      completed: notificationPermission === 'granted',
      description: 'Permití las notificaciones desde la app instalada',
      instructions: [
        'Abre la app desde tu pantalla de inicio',
        'Suscribite al programa que desees',
        'Aceptá las notificaciones cuando aparezca el mensaje',
        '¡Ya recibirás alertas de tus programas!'
      ]
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const allComplete = completedSteps === steps.length;

  return (
    <Alert 
      severity="info" 
      sx={{ 
        mb: 3,
        '& .MuiAlert-message': {
          width: '100%',
        }
      }}
      action={
        <IconButton
          color="inherit"
          size="small"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      }
    >
      <Box>
        <Typography variant="body2">
          {allComplete 
            ? '¡Perfecto! Ya recibes notificaciones push instantáneas' 
            : 'Actualmente recibes notificaciones por email. Para recibir notificaciones push instantáneas, sigue estos sencillos pasos:'
          }
        </Typography>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {allComplete ? (
              <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                🎉 ¡Todo configurado! Ahora recibirás alertas instantáneas de tus programas favoritos.
              </Typography>
            ) : (
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
            )}
          </Box>
        </Collapse>
      </Box>
    </Alert>
  );
} 