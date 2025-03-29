import { useEffect, useState } from 'react';
import { Box, Container, ThemeProvider, createTheme, useMediaQuery, CircularProgress, Typography } from '@mui/material';
import { ScheduleGridDesktop } from '@/components/ScheduleGridDesktop';
import { ScheduleGridMobile } from '@/components/ScheduleGridMobile';
import { Calendar, Clock, Tv2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { Schedule } from '@/types/schedule';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#059669',
      light: '#10b981',
      dark: '#047857',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    subtitle1: {
      fontSize: '1.125rem',
      lineHeight: 1.5,
      color: '#64748b',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 20px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          },
        },
        outlined: {
          borderColor: '#e2e8f0',
          color: '#64748b',
          backgroundColor: '#ffffff',
          '&:hover': {
            borderColor: '#cbd5e1',
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1e293b',
          padding: '12px 16px',
          maxWidth: 320,
          fontSize: '0.875rem',
          lineHeight: 1.5,
          borderRadius: 8,
        },
        arrow: {
          color: '#1e293b',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (min-width: 1200px)': {
            maxWidth: 1400,
          },
        },
      },
    },
  },
});

const MotionBox = motion(Box);

export default function Home() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    api.get('/schedules')
      .then((res) => {
        console.log('📦 Schedules from backend:', res.data);
        setSchedules(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Get unique channels from schedules
  const channels = Array.from(
    new Map(
      schedules.map((s) => [s.program.channel.id, s.program.channel])
    ).values()
  );

  return (
    <ThemeProvider theme={theme}>
      <Box 
        sx={{ 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          py: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 2 },
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '400px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            opacity: 0.05,
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="xl">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            sx={{ 
              mb: 6,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 2,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)',
              p: 3,
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              backdropFilter: 'blur(8px)',
            }}>
              <Tv2 size={40} style={{ 
                  color: '#2563eb',
                  strokeWidth: 1.5 
                }} />
              <Box>
                <Typography variant="h1" sx={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', mb: 1 }}>
                  TV Schedule
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#4B5563', fontWeight: 400 }}>
                  Your complete guide to weekly programming
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 4, 
              flexWrap: 'wrap',
              mt: 4,
              p: 3,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(8px)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Calendar size={20} style={{ 
                  color: '#2563eb',
                  strokeWidth: 1.5 
                }} />
                <Typography sx={{ color: '#374151', fontWeight: 500 }}>
                  Weekly Programming
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Clock size={20} style={{ 
                  color: '#2563eb',
                  strokeWidth: 1.5 
                }} />
                <Typography sx={{ color: '#374151', fontWeight: 500 }}>
                  Live Updates
                </Typography>
              </Box>
            </Box>
          </MotionBox>
          
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            sx={{
              background: 'rgba(255,255,255,0.9)',
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              overflow: 'hidden',
              backdropFilter: 'blur(8px)',
            }}
          >
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              isMobile ? (
                <ScheduleGridMobile channels={channels} schedules={schedules} />
              ) : (
                <ScheduleGridDesktop channels={channels} schedules={schedules} />
              )
            )}
          </MotionBox>
        </Container>
      </Box>
    </ThemeProvider>
  );
}