'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Button, Chip } from '@mui/material';
import { usePush } from '@/contexts/PushContext';

export default function PWADebugger() {
  const { isIOSDevice, isPWAInstalled, notificationPermission } = usePush();
  
  const [debugInfo, setDebugInfo] = React.useState<Record<string, unknown>>({});
  const [isVisible, setIsVisible] = React.useState(true);

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
  }, [isIOSDevice, isPWAInstalled, notificationPermission]);

  React.useEffect(() => {
    refreshDebugInfo();
    const interval = setInterval(refreshDebugInfo, 2000);
    return () => clearInterval(interval);
  }, [isIOSDevice, isPWAInstalled, notificationPermission, refreshDebugInfo]);

  if (!isIOSDevice) {
    return null;
  }

  if (!isVisible) {
    return (
      <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
        <Button 
          variant="contained" 
          onClick={() => setIsVisible(true)}
          size="small"
          sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}
        >
          🐛 Show Debug
        </Button>
      </Box>
    );
  }

  return (
    <Card sx={{ m: 2, bgcolor: 'warning.light', position: 'relative' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'warning.dark' }}>
            🐛 PWA Debug Info (iOS only)
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => setIsVisible(false)}
            size="small"
            sx={{ minWidth: 'auto', px: 1 }}
          >
            ✕
          </Button>
        </Box>
        
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
          sx={{ mr: 1 }}
        >
          Refresh Debug Info
        </Button>
        
        <Button 
          variant="contained" 
          onClick={() => {
            if (window.location.search.includes('manual_pwa=true')) {
              window.location.href = window.location.pathname;
            } else {
              window.location.href = window.location.pathname + '?manual_pwa=true';
            }
          }}
          size="small"
          color="primary"
        >
          {window.location.search.includes('manual_pwa=true') ? 'Remove Manual PWA' : 'Test Manual PWA'}
        </Button>
        
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
          Para instalar: Safari → Compartir → Añadir a pantalla de inicio → Abrir desde el ícono
        </Typography>
      </CardContent>
    </Card>
  );
} 