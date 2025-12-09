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
  CircularProgress,
  Chip,
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
import { useStreamersConfig } from '@/hooks/useStreamersConfig';
import { getColorForChannel } from '@/utils/colors';
import { useState, useEffect, useRef } from 'react';
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
  const { streamersEnabled } = useStreamersConfig();
  const { openVideo, openStream } = useYouTubePlayer();
  const [streamers, setStreamers] = useState<Streamer[]>(initialStreamers || []);
  // Only show loading if we have no initial data at all (undefined/null, not empty array)
  const [loading, setLoading] = useState(!initialStreamers);
  const hasFetchedRef = useRef(false); // Track if we've already fetched to prevent double-fetch

  const fetchStreamers = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const res = await fetch('/api/streamers/visible', {
        cache: 'no-store', // Ensure we get fresh data
      });
      if (!res.ok) throw new Error('Failed to fetch streamers');
      const data = await res.json();
      setStreamers(data);
      hasFetchedRef.current = true;
    } catch (err) {
      console.error('Error fetching streamers:', err);
      setStreamers([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Only fetch if we truly have no initial data (undefined/null) AND haven't fetched yet
    // If initialStreamers is an empty array [], it means server fetched successfully but found no streamers
    // In that case, don't fetch again - just use the empty array
    if ((initialStreamers === undefined || initialStreamers === null) && !hasFetchedRef.current) {
      // No initial data from server, need to fetch
      fetchStreamers();
    } else {
      // We have initial data (even if empty array), no need to show loading or fetch again
      setLoading(false);
      hasFetchedRef.current = true; // Mark as fetched to prevent double-fetch
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount, initialStreamers is from props

  // Listen for live status updates via SSE
  useEffect(() => {
    const handleLiveStatusRefresh = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventData = customEvent.detail;

      // Extract streamer info from SSE event payload
      // The backend sends: { type, entity, entityId, payload: { streamerId, isLive, ... } }
      const streamerIdRaw = eventData?.entityId || eventData?.payload?.streamerId;
      // Ensure streamerId is a number to match the Streamer type
      const streamerId = streamerIdRaw ? Number(streamerIdRaw) : null;
      const isLive = eventData?.payload?.isLive ?? false;

      if (streamerId && !isNaN(streamerId)) {
        // Update only the specific streamer's live status without showing spinner
        setStreamers(prevStreamers => {
          const streamerExists = prevStreamers.some(s => s.id === streamerId);
          
          if (!streamerExists) {
            return prevStreamers;
          }
          
          // Check if update is actually needed
          const currentStreamer = prevStreamers.find(s => s.id === streamerId);
          if (currentStreamer?.is_live === isLive) {
            return prevStreamers;
          }
          
          const updated = prevStreamers.map(streamer => {
            if (streamer.id === streamerId) {
              // Create a new object to ensure React detects the change
              return { ...streamer, is_live: isLive };
            }
            return streamer;
          });
          
          return updated;
        });
      } else {
        // Fallback: if we don't have streamerId, silently refetch in background (no spinner)
        fetch('/api/streamers/visible', { cache: 'no-store' })
          .then(res => res.json())
          .then(data => {
            setStreamers(data);
          })
          .catch(err => console.error('Error silently refetching streamers:', err));
      }
    };

    window.addEventListener('liveStatusRefresh', handleLiveStatusRefresh);
    return () => {
      window.removeEventListener('liveStatusRefresh', handleLiveStatusRefresh);
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
        // Add bottom padding on mobile for bottom navigation + safe area inset (only if streamers enabled)
        pb: { 
          xs: streamersEnabled ? 'calc(72px + env(safe-area-inset-bottom, 0px))' : 1, 
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
            <Grid container spacing={2}>
              {streamers.map((streamer, index) => (
                <Grid size={{ xs: 6, sm: 4, md: 2, lg: 2 }} key={streamer.id}>
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
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: mode === 'light'
                          ? '0 12px 24px rgba(0,0,0,0.15)'
                          : '0 12px 24px rgba(0,0,0,0.4)',
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      {/* Image Section - Square */}
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '1 / 1',
                          overflow: 'hidden',
                          backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                        }}
                      >
                        {/* LIVE Badge */}
                        {streamer.is_live && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              backgroundColor: '#f44336',
                              color: 'white',
                              fontSize: '0.6rem',
                              padding: '3px 6px',
                              borderRadius: '3px',
                              fontWeight: 'bold',
                              zIndex: 5,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                            }}
                          >
                            LIVE
                          </Box>
                        )}
                        {streamer.logo_url ? (
                          <Box
                            component="img"
                            src={streamer.logo_url}
                            alt={streamer.name}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: getColorForChannel(index, mode),
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '2rem',
                                fontWeight: 700,
                                color: 'white',
                              }}
                            >
                              {streamer.name.charAt(0).toUpperCase()}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Content Section */}
                      <Box sx={{ pt: 1.5, px: 1.5, pb: 0, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        {/* Name */}
                        <Typography 
                          variant="subtitle1" 
                          component="h3" 
                          fontWeight={600}
                          sx={{ 
                            mb: streamer.categories && streamer.categories.length > 0 ? 0.75 : 1,
                            textAlign: 'center',
                            lineHeight: 1.2,
                            fontSize: '0.9rem',
                          }}
                        >
                          {streamer.name}
                        </Typography>

                        {/* Categories */}
                        {streamer.categories && streamer.categories.length > 0 && (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: 0.5,
                              justifyContent: 'center',
                              mb: 1.25,
                            }}
                          >
                            {streamer.categories.slice(0, 2).map((category) => (
                              <Chip
                                key={category.id}
                                label={category.name}
                                size="small"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: 20,
                                  backgroundColor: category.color 
                                    ? `${category.color}20`
                                    : mode === 'light'
                                    ? 'rgba(0,0,0,0.08)'
                                    : 'rgba(255,255,255,0.1)',
                                  color: category.color || 'text.secondary',
                                  border: category.color ? `1px solid ${category.color}40` : 'none',
                                }}
                              />
                            ))}
                          </Box>
                        )}

                        {/* Service Buttons */}
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 0.75,
                            mt: 'auto',
                          }}
                        >
                          {streamer.services
                            .filter(service => service.service === StreamingService.TWITCH || service.service === StreamingService.KICK)
                            .map((service, serviceIndex) => {
                              const serviceIconUrl = getServiceIconUrl(service.service);
                              
                              return (
                                <Button
                                  key={serviceIndex}
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  onClick={() => handleServiceClick(service.service, service.url)}
                                  sx={{
                                    justifyContent: 'center',
                                    borderRadius: 1.5,
                                    borderColor: getServiceColor(service.service, mode),
                                    color: getServiceColor(service.service, mode),
                                    textTransform: 'none',
                                    gap: 1,
                                    py: 0.75,
                                    px: 1.5,
                                    minHeight: 36,
                                    '&:hover': {
                                      borderColor: getServiceColor(service.service, mode),
                                      backgroundColor: mode === 'light'
                                        ? `${getServiceColor(service.service, mode)}15`
                                        : `${getServiceColor(service.service, mode)}25`,
                                    }
                                  }}
                                >
                                  {serviceIconUrl && (
                                    <Box
                                      component="img"
                                      src={serviceIconUrl}
                                      alt={`${getServiceName(service.service)} icon`}
                                      sx={{
                                        width: 16,
                                        height: 16,
                                        objectFit: 'contain',
                                      }}
                                    />
                                  )}
                                  <Typography variant="caption" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
                                    Ver en {getServiceName(service.service)}
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

