import { Box, Container, ThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import { ScheduleGridDesktop } from './components/ScheduleGridDesktop';
import { ScheduleGridMobile } from './components/ScheduleGridMobile';
import { Calendar, Clock, Tv2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          '&:hover': {
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
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

// Mock data for demonstration
const mockChannels = [
  { id: '1', name: 'Channel 1', description: 'News and Entertainment', logo_url: 'https://via.placeholder.com/40' },
  { id: '2', name: 'Channel 2', description: 'Sports and Lifestyle', logo_url: 'https://via.placeholder.com/40' },
];

const mockSchedules = [
  {
    id: 1,
    day_of_week: 'monday',
    start_time: '07:00',
    end_time: '09:00',
    program: {
      id: '1',
      name: 'Morning Show',
      description: 'Start your day with the latest news and entertainment',
      channelId: '1',
      startTime: '07:00',
      endTime: '09:00',
      channel: { id: '1', name: 'Channel 1', description: 'News and Entertainment' },
      panelists: [
        { id: '1', name: 'John Doe', avatar_url: 'https://via.placeholder.com/32' },
        { id: '2', name: 'Jane Smith', avatar_url: 'https://via.placeholder.com/32' }
      ],
    },
  },
];

const MotionBox = motion(Box);

function App() {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <ThemeProvider theme={theme}>
      <Box 
        sx={{ 
          minHeight: '100vh',
          bgcolor: 'background.default',
          py: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 2 },
        }}
      >
        <Container maxWidth="xl">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            sx={{ mb: 6 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Tv2 size={32} className="text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">TV Schedule</h1>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Calendar size={20} className="text-gray-500" />
                <p className="text-gray-600">Weekly Programming</p>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Clock size={20} className="text-gray-500" />
                <p className="text-gray-600">Live Updates</p>
              </Box>
            </Box>
          </MotionBox>
          
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {isMobile ? (
              <ScheduleGridMobile channels={mockChannels} schedules={mockSchedules} />
            ) : (
              <ScheduleGridDesktop channels={mockChannels} schedules={mockSchedules} />
            )}
          </MotionBox>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;