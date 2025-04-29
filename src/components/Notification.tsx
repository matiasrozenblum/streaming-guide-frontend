'use client';


import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeContext } from '@/contexts/ThemeContext';

export type Notification = {
  id: number;
  message: string;
  durationMs?: number;
};

interface Props {
    /** Si es true, renderiza inline dentro del header */
    inline?: boolean;
  }

export const NotificationBanner: React.FC<Props> = ({ inline = false }) => {
    const [notif, setNotif] = useState<Notification | null>(null);
    const [progress, setProgress] = useState(100);
    const { mode, theme } = useThemeContext();

  useEffect(() => {
    // Al montar, pedir al backend la novedad activa
    /*fetch('/api/notifications/active')
      .then((r) => r.json())
      .then((data: Notification | null) => {
        if (data) setNotif(data);
      });*/
    setNotif({
      id: 1,
      message: 'Test notification',
      durationMs: 5000,
    });
  }, []);

  // 2) animar el progreso de 100 → 0
  useEffect(() => {
    if (!notif) return;
    const total = notif.durationMs ?? 5000;
    const interval = 100;
    const tick = (interval / total) * 100;
    const timer = setInterval(() => {
      setProgress(p => {
        const next = p - tick;
        if (next <= 0) {
          clearInterval(timer);
          setNotif(null);
          return 0;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [notif]);

  if (!notif || !inline) return null;

  // estilos
  const bg = mode === 'light'
    ? theme.palette.background.paper
    : theme.palette.background.default;
  const border = mode === 'light'
    ? `1px solid ${theme.palette.primary.main}`
    : `1px solid ${theme.palette.primary.light}`;
  const color = theme.palette.text.primary;

  return (
    <AnimatePresence>
      {notif && (
        <motion.div
          initial={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box
            sx={{
              position: 'relative',
              px: 2,
              py: 1,
              bgcolor: bg,
              border,
              borderRadius: 1,
              color,
              display: 'flex',
              alignItems: 'center',
              minWidth: 200,
              maxWidth: 400,
              ml: 2,
            }}
          >
            <Typography
              variant="body2"
              noWrap
              sx={{ flex: 1 }}
            >
              {notif.message}
            </Typography>

            <Box
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
              }}
            >
              <CircularProgress
                variant="determinate"
                value={progress}
                size={20}
                thickness={4}
                sx={{ color: theme.palette.primary.main }}
              />
            </Box>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};