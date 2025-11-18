'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  Link,
} from '@mui/material';
import {
  ArrowBack,
  LiveTv,
  OpenInNew,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useThemeContext } from '@/contexts/ThemeContext';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { Streamer, StreamingService } from '@/types/streamer';
import { getColorForChannel } from '@/utils/colors';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

// Mocked data - will be replaced with API call later
const MOCK_STREAMERS: Streamer[] = [
  {
    id: '1',
    name: 'davoxeneize',
    displayName: 'DavoXeneize',
    services: [
      {
        service: StreamingService.TWITCH,
        url: 'https://www.twitch.tv/davoxeneize',
        username: 'davoxeneize',
      },
      {
        service: StreamingService.KICK,
        url: 'https://kick.com/davoxeneize',
        username: 'davoxeneize',
      },
    ],
    description: 'Streamer de gaming y entretenimiento',
    isLive: false,
  },
  {
    id: '2',
    name: 'lacobra',
    displayName: 'LaCobra',
    services: [
      {
        service: StreamingService.TWITCH,
        url: 'https://www.twitch.tv/lacobra',
        username: 'lacobra',
      },
    ],
    description: 'Contenido variado y charlas',
    isLive: true,
  },
  {
    id: '3',
    name: 'mernosketti',
    displayName: 'Mernosketti',
    services: [
      {
        service: StreamingService.KICK,
        url: 'https://kick.com/mernosketti',
        username: 'mernosketti',
      },
      {
        service: StreamingService.TWITCH,
        url: 'https://www.twitch.tv/mernosketti',
        username: 'mernosketti',
      },
    ],
    description: 'Streaming de juegos y eventos',
    isLive: false,
  },
  {
    id: '4',
    name: 'robergalati',
    displayName: 'RoberGalati',
    services: [
      {
        service: StreamingService.TWITCH,
        url: 'https://www.twitch.tv/robergalati',
        username: 'robergalati',
      },
      {
        service: StreamingService.KICK,
        url: 'https://kick.com/robergalati',
        username: 'robergalati',
      },
      {
        service: StreamingService.YOUTUBE,
        url: 'https://www.youtube.com/@robergalati',
        username: 'robergalati',
      },
    ],
    description: 'Variedad de contenido y colaboraciones',
    isLive: false,
  },
];

const getServiceColor = (service: StreamingService, mode: 'light' | 'dark'): string => {
  switch (service) {
    case StreamingService.TWITCH:
      return mode === 'light' ? '#9146FF' : '#A970FF';
    case StreamingService.KICK:
      return mode === 'light' ? '#53FC18' : '#6AFF3A';
    case StreamingService.YOUTUBE:
      return mode === 'light' ? '#FF0000' : '#FF4444';
    default:
      return mode === 'light' ? '#1976d2' : '#42a5f5';
  }
};

const getServiceName = (service: StreamingService): string => {
  switch (service) {
    case StreamingService.TWITCH:
      return 'Twitch';
    case StreamingService.KICK:
      return 'Kick';
    case StreamingService.YOUTUBE:
      return 'YouTube';
    default:
      return service;
  }
};

interface StreamersClientProps {
  initialStreamers?: Streamer[];
}

export default function StreamersClient({ initialStreamers }: StreamersClientProps) {
  const router = useRouter();
  const { mode } = useThemeContext();
  const streamers = initialStreamers || MOCK_STREAMERS;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: mode === 'light'
          ? 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)'
          : 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
        py: { xs: 1, sm: 2 },
        pb: { xs: 9, sm: 2 }, // Add bottom padding on mobile for bottom navigation
      }}
    >
      <Header />
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: 4, 
          mb: 6,
          px: { xs: 2, sm: 3 },
        }}
      >
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 4,
            }}
          >
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  background: mode === 'light'
                    ? 'linear-gradient(to right, #1a237e, #0d47a1)'
                    : 'linear-gradient(to right, #90caf9, #42a5f5)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                Streamers
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Descubre y sigue a tus streamers favoritos en diferentes plataformas
              </Typography>
            </Box>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.push('/')}
              variant="outlined"
              size="large"
              sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
            >
              Volver
            </Button>
          </Box>

          {streamers.length === 0 ? (
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              sx={{ 
                textAlign: 'center', 
                py: 8,
                background: mode === 'light'
                  ? 'linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.8) 100%)'
                  : 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
                backdropFilter: 'blur(8px)',
                borderRadius: 3,
                border: mode === 'light' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <CardContent>
                <LiveTv sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
                <Typography variant="h5" gutterBottom fontWeight={600}>
                  No hay streamers disponibles
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                  Próximamente agregaremos más streamers a la lista
                </Typography>
              </CardContent>
            </MotionCard>
          ) : (
            <Grid container spacing={3}>
              {streamers.map((streamer, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={streamer.id}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      background: mode === 'light'
                        ? 'linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.8) 100%)'
                        : 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 3,
                      border: mode === 'light' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: mode === 'light'
                          ? '0 12px 24px rgba(0,0,0,0.15)'
                          : '0 12px 24px rgba(0,0,0,0.4)',
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        {streamer.logoUrl ? (
                          <Avatar
                            src={streamer.logoUrl}
                            alt={streamer.displayName}
                            sx={{ width: 56, height: 56, mr: 2 }}
                          />
                        ) : (
                          <Avatar 
                            sx={{ 
                              width: 56, 
                              height: 56, 
                              mr: 2,
                              backgroundColor: getColorForChannel(index, mode),
                              fontSize: '1.5rem',
                              fontWeight: 600,
                              color: 'white',
                            }}
                          >
                            {streamer.displayName.charAt(0)}
                          </Avatar>
                        )}
                        <Box flexGrow={1}>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Typography variant="h6" component="h3" fontWeight={600}>
                              {streamer.displayName}
                            </Typography>
                            {streamer.isLive && (
                              <Chip
                                label="LIVE"
                                size="small"
                                sx={{
                                  backgroundColor: '#FF0000',
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  height: 20,
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            @{streamer.name}
                          </Typography>
                        </Box>
                      </Box>

                      {streamer.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.5,
                          }}
                        >
                          {streamer.description}
                        </Typography>
                      )}

                      <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight={600} sx={{ mb: 1.5 }}>
                          Plataformas:
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={1}>
                          {streamer.services.map((service, serviceIndex) => (
                            <Link
                              key={serviceIndex}
                              href={service.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              underline="none"
                            >
                              <Button
                                fullWidth
                                variant="outlined"
                                size="small"
                                endIcon={<OpenInNew fontSize="small" />}
                                sx={{
                                  justifyContent: 'space-between',
                                  borderRadius: 2,
                                  borderColor: getServiceColor(service.service, mode),
                                  color: getServiceColor(service.service, mode),
                                  textTransform: 'none',
                                  '&:hover': {
                                    borderColor: getServiceColor(service.service, mode),
                                    backgroundColor: mode === 'light'
                                      ? `${getServiceColor(service.service, mode)}15`
                                      : `${getServiceColor(service.service, mode)}25`,
                                  }
                                }}
                              >
                                {getServiceName(service.service)}
                              </Button>
                            </Link>
                          ))}
                        </Box>
                      </Box>
                    </CardContent>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          )}
        </MotionBox>
      </Container>
      <BottomNavigation />
    </Box>
  );
}

