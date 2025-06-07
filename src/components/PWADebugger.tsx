'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Button, Chip } from '@mui/material';
import { usePush } from '@/contexts/PushContext';

export default function PWADebugger() {
  const { isIOSDevice, isPWAInstalled, notificationPermission } = usePush();
  
  const [debugInfo, setDebugInfo] = React.useState<Record<string, unknown>>({});

  const refreshDebugInfo = React.useCallback(() => {
    if (typeof window === 'undefined') return;

    const info = {
      timestamp: new Date().toLocaleTimeString(),
      isIOSDevice,
      isPWAInstalled,
      notificationPermission,
      userAgent: navigator.userAgent,
      standalone: (window.navigator as unknown as { standalone?: boolean }).standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      currentURL: window.location.href,
      urlSearchParams: window.location.search,
      sourceParam: new URLSearchParams(window.location.search).get('source'),
      windowLocation: {
        href: window.location.href,
        search: window.location.search,
        pathname: window.location.pathname,
        origin: window.location.origin
      }
    };
    
    setDebugInfo(info);
    console.log('🐛 PWA Debug Info:', info);
  }, [isIOSDevice, isPWAInstalled, notificationPermission]);

  React.useEffect(() => {
    refreshDebugInfo();
    const interval = setInterval(refreshDebugInfo, 2000);
    return () => clearInterval(interval);
  }, [isIOSDevice, isPWAInstalled, notificationPermission, refreshDebugInfo]);

  if (!isIOSDevice) {
    return null;
  }

  return (
    <Card sx={{ m: 2, bgcolor: 'warning.light' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, color: 'warning.dark' }}>
          🐛 PWA Debug Info (iOS only)
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={`iOS Device: ${isIOSDevice ? '✅' : '❌'}`} 
            color={isIOSDevice ? 'success' : 'error'} 
            sx={{ mr: 1, mb: 1 }} 
          />
          <Chip 
            label={`PWA Installed: ${isPWAInstalled ? '✅' : '❌'}`} 
            color={isPWAInstalled ? 'success' : 'error'} 
            sx={{ mr: 1, mb: 1 }} 
          />
          <Chip 
            label={`Notifications: ${notificationPermission}`} 
            color={notificationPermission === 'granted' ? 'success' : 'warning'} 
            sx={{ mr: 1, mb: 1 }} 
          />
        </Box>

        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Detection Details:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </Typography>
        </Box>

        <Button 
          variant="outlined" 
          onClick={refreshDebugInfo}
          size="small"
        >
          Refresh Debug Info
        </Button>
        
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
          Para instalar: Safari → Compartir → Añadir a pantalla de inicio → Abrir desde el ícono
        </Typography>
      </CardContent>
    </Card>
  );
} 