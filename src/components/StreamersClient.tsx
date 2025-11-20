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
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  LiveTv,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useYouTubePlayer } from '@/contexts/YouTubeGlobalPlayerContext';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { Streamer, StreamingService } from '@/types/streamer';
import { getColorForChannel } from '@/utils/colors';
import { useState, useEffect } from 'react';
import { extractTwitchChannel, extractKickChannel } from '@/utils/extractStreamChannel';
import { extractVideoId } from '@/utils/extractVideoId';

const MotionBox = motion(Box);
const MotionCard = motion(Card);


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

const getServiceIconUrl = (service: StreamingService): string | null => {
  switch (service) {
    case StreamingService.TWITCH:
      return 'https://dwtkmfahaokhtpuafhsc.supabase.co/storage/v1/object/sign/streaming-services-logos/twitch_glitch_flat_purple.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84ZWQzMzdmNy04YmEwLTQxYjAtYmJjOS05YjI2NjVhZWYwYzIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHJlYW1pbmctc2VydmljZXMtbG9nb3MvdHdpdGNoX2dsaXRjaF9mbGF0X3B1cnBsZS5wbmciLCJpYXQiOjE3NjM1MjA4NTUsImV4cCI6MTc5NTA1Njg1NX0.9nqfLHXQIsExihVdeGIaAnhWqlW9zRnx0FPFqHarVpA';
    case StreamingService.KICK:
      return 'https://dwtkmfahaokhtpuafhsc.supabase.co/storage/v1/object/sign/streaming-services-logos/Kick%20Icon%20(Green).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84ZWQzMzdmNy04YmEwLTQxYjAtYmJjOS05YjI2NjVhZWYwYzIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHJlYW1pbmctc2VydmljZXMtbG9nb3MvS2ljayBJY29uIChHcmVlbikucG5nIiwiaWF0IjoxNzYzNTIwODQyLCJleHAiOjE3OTUwNTY4NDJ9.3cqNHCk9mYT4k6E7mUiIDIA8CWXWIKTUQK1iThtSrmo';
    case StreamingService.YOUTUBE:
      return null; // YouTube doesn't have an icon in the requirements
    default:
      return null;
  }
};

interface StreamersClientProps {
  initialStreamers?: Streamer[];
}

export default function StreamersClient({ initialStreamers }: StreamersClientProps) {
  const router = useRouter();
  const { mode } = useThemeContext();
  const { openVideo, openStream } = useYouTubePlayer();
  const [streamers, setStreamers] = useState<Streamer[]>(initialStreamers || []);
  const [loading, setLoading] = useState(!initialStreamers);

  const fetchStreamers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/streamers/visible', {
        cache: 'no-store', // Ensure we get fresh data
      });
      if (!res.ok) throw new Error('Failed to fetch streamers');
      const data = await res.json();
      console.log('📡 Fetched streamers with live status:', data);
      console.log('🔍 Streamer 1 (Mernuel) is_live:', data.find((s: Streamer) => s.id === 1)?.is_live);
      setStreamers(data);
    } catch (err) {
      console.error('Error fetching streamers:', err);
      setStreamers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialStreamers) {
      fetchStreamers();
    }
  }, [initialStreamers]);

  // Listen for live status updates via SSE
  useEffect(() => {
    const handleLiveStatusRefresh = (event: CustomEvent) => {
      const eventData = event.detail;
      console.log('🔄 Live status refresh event received:', eventData);

      // Extract streamer info from SSE event payload
      const streamerId = eventData.entityId || eventData.payload?.streamerId;
      const isLive = eventData.payload?.isLive ?? false;

      if (streamerId) {
        // Update only the specific streamer's live status without showing spinner
        setStreamers(prevStreamers => 
          prevStreamers.map(streamer => 
            streamer.id === streamerId
              ? { ...streamer, is_live: isLive }
              : streamer
          )
        );
        console.log(`✅ Updated streamer ${streamerId} live status to ${isLive} (no spinner)`);
      } else {
        // Fallback: if we don't have streamerId, silently refetch in background
        console.log('⚠️ No streamerId in event, silently refetching...');
        fetch('/api/streamers/visible', { cache: 'no-store' })
          .then(res => res.json())
          .then(data => {
            setStreamers(data);
            console.log('📡 Silently updated all streamers');
          })
          .catch(err => console.error('Error silently refetching streamers:', err));
      }
    };

    window.addEventListener('liveStatusRefresh', handleLiveStatusRefresh as EventListener);
    return () => {
      window.removeEventListener('liveStatusRefresh', handleLiveStatusRefresh as EventListener);
    };
  }, []);

  const handleServiceClick = (service: StreamingService, url: string) => {
    if (service === StreamingService.YOUTUBE) {
      // For YouTube, extract video ID and use openVideo
      // Note: YouTube only supports embedding videos, not channel pages
      const videoId = extractVideoId(url);
      if (videoId && !videoId.startsWith('http') && !videoId.includes('@')) {
        // It's a valid video ID - use it
        openVideo(videoId);
      }
      // If it's a channel URL, we can't embed it directly
      // The URL should be a video URL for embedding to work
    } else if (service === StreamingService.TWITCH) {
      const channelName = extractTwitchChannel(url);
      if (channelName) {
        openStream('twitch', channelName);
      }
    } else if (service === StreamingService.KICK) {
      const channelName = extractKickChannel(url);
      if (channelName) {
        openStream('kick', channelName);
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: mode === 'light'
          ? 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)'
          : 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
        py: { xs: 1, sm: 2 },
        // Add bottom padding on mobile for bottom navigation + safe area inset
        pb: { 
          xs: 'calc(72px + env(safe-area-inset-bottom, 0px))', 
          sm: 2 
        },
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

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <CircularProgress />
            </Box>
          ) : streamers.length === 0 ? (
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
                    <CardContent sx={{ flexGrow: 1, p: 3, position: 'relative' }}>
                      {/* LIVE Badge */}
                      {streamer.is_live && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            backgroundColor: '#f44336',
                            color: 'white',
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            zIndex: 5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          LIVE
                        </Box>
                      )}
                      <Box display="flex" alignItems="center" mb={2}>
                        {streamer.logo_url ? (
                          <Avatar
                            src={streamer.logo_url}
                            alt={streamer.name}
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
                            {streamer.name.charAt(0)}
                          </Avatar>
                        )}
                        <Box flexGrow={1}>
                          <Typography variant="h6" component="h3" fontWeight={600}>
                            {streamer.name}
                          </Typography>
                        </Box>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight={600} sx={{ mb: 1.5 }}>
                          Plataformas:
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={1}>
                          {streamer.services.map((service, serviceIndex) => {
                            const serviceIconUrl = getServiceIconUrl(service.service);
                            const isTwitchOrKick = service.service === StreamingService.TWITCH || service.service === StreamingService.KICK;
                            
                            return (
                              <Button
                                key={serviceIndex}
                                variant="outlined"
                                size={isTwitchOrKick ? "medium" : "small"}
                                onClick={() => handleServiceClick(service.service, service.url)}
                                sx={{
                                  width: isTwitchOrKick ? 'fit-content' : 'auto',
                                  minWidth: isTwitchOrKick ? 140 : 'auto',
                                  justifyContent: 'flex-start',
                                  borderRadius: 2,
                                  borderColor: getServiceColor(service.service, mode),
                                  color: getServiceColor(service.service, mode),
                                  textTransform: 'none',
                                  gap: 1.5,
                                  py: isTwitchOrKick ? 1.25 : 0.75,
                                  px: 2,
                                  whiteSpace: 'nowrap',
                                  '&:hover': {
                                    borderColor: getServiceColor(service.service, mode),
                                    backgroundColor: mode === 'light'
                                      ? `${getServiceColor(service.service, mode)}15`
                                      : `${getServiceColor(service.service, mode)}25`,
                                  }
                                }}
                              >
                                {isTwitchOrKick && serviceIconUrl && (
                                  <Box
                                    component="img"
                                    src={serviceIconUrl}
                                    alt={`${getServiceName(service.service)} icon`}
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      objectFit: 'contain',
                                    }}
                                  />
                                )}
                                <Typography variant="body2" fontWeight={500}>
                                  {isTwitchOrKick ? `Ver en ${getServiceName(service.service)}` : getServiceName(service.service)}
                                </Typography>
                              </Button>
                            );
                          })}
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

