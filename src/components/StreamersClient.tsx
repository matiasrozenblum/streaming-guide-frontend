'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Chip,
  alpha,
  Avatar
} from '@mui/material';
import {
  LiveTv,
  OpenInNew
} from '@mui/icons-material';
import { useYouTubePlayer } from '@/contexts/YouTubeGlobalPlayerContext';
import { useSessionContext } from '@/contexts/SessionContext';
import { event as gaEvent } from '@/lib/gtag';
import type { SessionWithToken } from '@/types/session';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { Streamer, StreamingService } from '@/types/streamer';
import { Category } from '@/types/channel';
import { useStreamersConfig } from '@/hooks/useStreamersConfig';
import { extractVideoId } from '@/utils/extractVideoId';

const MotionCard = motion(Card);

const getServiceColor = (service: StreamingService): string => {
  switch (service) {
    case StreamingService.TWITCH:
      return '#A970FF'; // Twitch Purple
    case StreamingService.KICK:
      return '#53FC18'; // Kick Green
    case StreamingService.YOUTUBE:
      return '#FF0000'; // YouTube Red
    default:
      return '#42a5f5';
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
      return null;
    default:
      return null;
  }
};

interface StreamersClientProps {
  initialStreamers?: Streamer[];
  initialCategories?: Category[];
  streamersEnabled?: boolean;
}

export default function StreamersClient({ initialStreamers, initialCategories = [], streamersEnabled }: StreamersClientProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _initialCategories = initialCategories;
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const streamersConfigHook = useStreamersConfig();
  const finalStreamersEnabled = streamersEnabled ?? streamersConfigHook.streamersEnabled;
  const { openVideo } = useYouTubePlayer();
  const [streamers, setStreamers] = useState<Streamer[]>(initialStreamers || []);
  const [loading, setLoading] = useState(!initialStreamers);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (initialStreamers !== undefined && initialStreamers !== null) {
      setStreamers(initialStreamers);
      setLoading(false);
      hasFetchedRef.current = true;
    }
  }, [initialStreamers]);

  const fetchStreamers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch('/api/streamers/visible', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch streamers');
      const data = await res.json();
      setStreamers(data);
      hasFetchedRef.current = true;
    } catch (err) {
      console.error('Error fetching streamers:', err);
      setStreamers([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if ((initialStreamers === undefined || initialStreamers === null) && !hasFetchedRef.current) {
      fetchStreamers();
    } else {
      setLoading(false);
      hasFetchedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleLiveStatusRefresh = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventData = customEvent.detail;
      const streamerIdRaw = eventData?.entityId || eventData?.payload?.streamerId;
      const streamerId = streamerIdRaw ? Number(streamerIdRaw) : null;
      const isLive = eventData?.payload?.isLive ?? false;

      if (streamerId && !isNaN(streamerId)) {
        setStreamers(prevStreamers => {
          const streamerExists = prevStreamers.some(s => s.id === streamerId);
          if (!streamerExists) return prevStreamers;
          const currentStreamer = prevStreamers.find(s => s.id === streamerId);
          if (currentStreamer?.is_live === isLive) return prevStreamers;
          return prevStreamers.map(streamer =>
            streamer.id === streamerId ? { ...streamer, is_live: isLive } : streamer
          );
        });
      } else {
        fetch('/api/streamers/visible', { cache: 'no-store' })
          .then(res => res.json())
          .then(data => setStreamers(data))
          .catch(err => console.error('Error silently refetching streamers:', err));
      }
    };

    window.addEventListener('liveStatusRefresh', handleLiveStatusRefresh);
    return () => window.removeEventListener('liveStatusRefresh', handleLiveStatusRefresh);
  }, []);

  const handleStreamClick = (stream: Streamer, service: StreamingService, url: string) => {
    gaEvent({
      action: 'streamer_click',
      params: {
        streamer_name: stream.name,
        service: service,
        is_live: stream.is_live
      },
      userData: typedSession?.user
    });

    // YouTube handling
    if (service === StreamingService.YOUTUBE) {
      const videoId = extractVideoId(url);
      if (videoId) {
        openVideo(videoId);
        return;
      }
    }

    // Default open in new tab
    window.open(url, '_blank');
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: '#0f172a', // Flat dark background to match production
        pt: { xs: 2, sm: 3 },
        pb: { xs: 8, sm: 4 },
      }}
    >
      <Header streamersEnabled={finalStreamersEnabled} />

      <Container maxWidth="xl">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              color: '#ef4444', // Red-ish color similar to image
              mb: 1,
              background: 'linear-gradient(45deg, #ef4444 30%, #f472b6 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Streamers
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
            Descubre a los mejores creadores de contenido
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#ef4444' }} />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
            {streamers.map((stream, index) => {
              // Get primary service for card styling (Twitch or Kick priority)
              const primaryService = stream.services?.find(s => s.service === 'twitch')
                || stream.services?.find(s => s.service === 'kick')
                || stream.services?.[0];

              const cardBaseColor = getServiceColor((primaryService?.service || 'twitch') as StreamingService);

              return (
                <Box key={stream.id}>
                  <MotionCard
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      // Gradient background matching the service color (e.g. Purple -> Dark)
                      background: `linear-gradient(135deg, ${alpha(cardBaseColor, 0.8)} 0%, #1e293b 100%)`,
                      borderRadius: 2,
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 10px 20px -5px ${alpha(cardBaseColor, 0.4)}`
                      }
                    }}
                  >
                    {/* Status Badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        zIndex: 2
                      }}
                    >
                      <Chip
                        label={stream.is_live ? 'LIVE' : 'OFFLINE'}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(4px)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          height: 24,
                          border: `1px solid ${stream.is_live ? cardBaseColor : 'rgba(255,255,255,0.2)'}`,
                          '& .MuiChip-label': { px: 1.5 }
                        }}
                      />
                    </Box>

                    <CardContent sx={{ pt: 4, px: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {/* Avatar */}
                      <Avatar
                        src={stream.logo_url || undefined}
                        alt={stream.name}
                        sx={{
                          width: 100,
                          height: 100,
                          mb: 2,
                          border: `3px solid rgba(255,255,255,0.2)`,
                          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                          bgcolor: '#1e293b',
                          fontSize: '2rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {stream.name.slice(0, 1).toUpperCase()}
                      </Avatar>

                      {/* Name */}
                      <Typography variant="h5" component="h2" sx={{ color: '#fff', fontWeight: 700, textAlign: 'center', mb: 0.5 }}>
                        {stream.name}
                      </Typography>

                      {/* Primary Service Source */}
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', mb: 2 }}>
                        {getServiceIconUrl((primaryService?.service) as StreamingService) && (
                          <Box component="img" src={getServiceIconUrl((primaryService?.service) as StreamingService)!} sx={{ width: 14, height: 14, mr: 0.5, objectFit: 'contain' }} />
                        )}
                        {primaryService ? getServiceName(primaryService.service as StreamingService) : 'Streamer'}
                      </Typography>

                      {/* Description */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: 42
                        }}
                      >
                        {stream.description || 'Sin descripción disponible.'}
                      </Typography>

                      {/* Tags */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 2 }}>
                        {stream.categories && stream.categories.length > 0 ? (
                          stream.categories.slice(0, 3).map((cat) => (
                            <Chip
                              key={cat.id}
                              label={cat.name}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: 'rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                            />
                          ))
                        ) : (
                          <Chip
                            label="General"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              bgcolor: 'rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.5)',
                            }}
                          />
                        )}
                      </Box>
                    </CardContent>

                    {/* Action Buttons Footer */}
                    <Box sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {stream.services.map((svc) => {
                        const svcColor = getServiceColor(svc.service as StreamingService);
                        const svcName = getServiceName(svc.service as StreamingService);

                        return (
                          <Button
                            key={`${stream.id}-${svc.service}`}
                            variant="outlined"
                            fullWidth
                            startIcon={svc.service === StreamingService.YOUTUBE ? <LiveTv /> : <OpenInNew />}
                            onClick={() => handleStreamClick(stream, svc.service as StreamingService, svc.url)}
                            sx={{
                              color: '#fff',
                              borderColor: svcColor,
                              borderWidth: 1,
                              '&:hover': {
                                borderColor: svcColor,
                                bgcolor: alpha(svcColor, 0.1),
                                borderWidth: 1
                              },
                              textTransform: 'none',
                              justifyContent: 'center',
                              fontWeight: 600
                            }}
                          >
                            Ver en {svcName}
                          </Button>
                        );
                      })}
                    </Box>
                  </MotionCard>
                </Box>
              );
            })}
          </Box>
        )}
      </Container>
      <BottomNavigation />
    </Box>
  );
}
