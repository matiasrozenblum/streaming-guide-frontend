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
  CircularProgress,
  Chip,
  alpha,
} from '@mui/material';
import {
  LiveTv,
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
import { useState, useEffect, useRef } from 'react';
import { extractTwitchChannel, extractKickChannel } from '@/utils/extractStreamChannel';
import { extractVideoId } from '@/utils/extractVideoId';

const MotionCard = motion(Card);

const getServiceColor = (service: StreamingService): string => {
  switch (service) {
    case StreamingService.TWITCH:
      return '#A970FF';
    case StreamingService.KICK:
      return '#6AFF3A';
    case StreamingService.YOUTUBE:
      return '#FF4444';
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
      return null; // YouTube doesn't have an icon in the requirements
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
  const _initialCategories = initialCategories; // Reserved for future category filtering feature
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  // Use prop if provided, otherwise fall back to hook for backward compatibility
  const streamersConfigHook = useStreamersConfig();
  const finalStreamersEnabled = streamersEnabled ?? streamersConfigHook.streamersEnabled;
  const { openVideo } = useYouTubePlayer();
  const [streamers, setStreamers] = useState<Streamer[]>(initialStreamers || []);
  // Only show loading if we have no initial data at all (undefined/null, not empty array)
  const [loading, setLoading] = useState(!initialStreamers);
  const hasFetchedRef = useRef(false); // Track if we've already fetched to prevent double-fetch

  // Sync refreshed server props into local state (e.g., after SSE router.refresh)
  useEffect(() => {
    if (initialStreamers !== undefined && initialStreamers !== null) {
      setStreamers(initialStreamers);
      setLoading(false);
      hasFetchedRef.current = true;
    }
  }, [initialStreamers]);

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

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
        pt: { xs: 2, sm: 3 },
        pb: { xs: 8, sm: 4 }, // Extra padding for bottom nav on mobile
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
              color: '#fff',
              mb: 1,
              background: 'linear-gradient(45deg, #FF4444 30%, #42a5f5 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 10px 20px rgba(0,0,0,0.5)'
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
            <CircularProgress sx={{ color: '#42a5f5' }} />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
            {streamers.map((stream, index) => {
              const youtubeService = stream.services?.find(s => s.service === 'youtube');
              const primaryService = stream.services?.find(s => s.service === 'twitch' || s.service === 'kick') || stream.services?.[0];
              const streaming_service = primaryService?.service;
              const channel_url = primaryService?.url;
              const youtube_stream_url = youtubeService?.url;

              const serviceColor = getServiceColor((streaming_service || 'twitch') as StreamingService);
              return (
                <Box key={stream.id}>
                  <MotionCard
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'rgba(30, 41, 59, 0.7)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 3,
                      border: '1px solid rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all 0.3s ease-in-out',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: `0 10px 20px -5px ${serviceColor}40`,
                        border: `1px solid ${serviceColor}80`,
                        '& .background-glow': {
                          opacity: 0.2,
                        }
                      }
                    }}
                    onClick={() => {
                      gaEvent({
                        action: 'streamer_click',
                        params: {
                          streamer_name: stream.name,
                          service: streaming_service || 'unknown',
                          is_live: stream.is_live
                        },
                        userData: typedSession?.user
                      });

                      // Check if it's YouTube content (has youtube_stream_url)
                      const youtubeVideoId = youtube_stream_url ? extractVideoId(youtube_stream_url) : null;
                      const isYouTubeService = streaming_service === StreamingService.YOUTUBE;

                      // Case 1: It's a YouTube video/stream (either service logic or URL logic)
                      if (youtubeVideoId || isYouTubeService) {
                        if (youtubeVideoId) {
                          openVideo(youtubeVideoId);
                        } else if (channel_url) {
                          // Fallback for YouTube channel without specific video
                          window.open(channel_url, '_blank');
                        }
                        return;
                      }

                      // Case 2: Twitch or Kick (handle standard platform URL extraction/opening)
                      const channelName = channel_url ?
                        (streaming_service === StreamingService.KICK
                          ? extractKickChannel(channel_url)
                          : extractTwitchChannel(channel_url))
                        : null;

                      if (channelName && (streaming_service === StreamingService.TWITCH || streaming_service === StreamingService.KICK)) {
                        // Open in new tab for now, or use openStream for embedded player if implemented
                        window.open(channel_url, '_blank');
                      } else if (channel_url) {
                        window.open(channel_url, '_blank');
                      }
                    }}
                  >
                    {/* Glow effect on hover */}
                    <Box
                      className="background-glow"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `radial-gradient(circle at center, ${serviceColor}, transparent 70%)`,
                        opacity: 0,
                        transition: 'opacity 0.3s ease-in-out',
                        pointerEvents: 'none',
                        zIndex: 0
                      }}
                    />

                    {/* Banner Image */}
                    <Box sx={{ position: 'relative', height: 140, overflow: 'hidden' }}>
                      {stream.banner_url ? (
                        <Box
                          component="img"
                          src={stream.banner_url}
                          alt={stream.name}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.5s ease',
                            '.MuiCard-root:hover &': {
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                      ) : (
                        // Fallback colorful pattern if no banner
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            background: `linear-gradient(45deg, ${serviceColor} 0%, #1e293b 100%)`,
                            opacity: 0.8
                          }}
                        />
                      )}

                      {/* Profile Image - overlapped */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -30,
                          left: 20,
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          border: stream.is_live
                            ? `3px solid ${serviceColor}`
                            : '3px solid rgba(255,255,255,0.1)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                          overflow: 'hidden',
                          zIndex: 2,
                          backgroundColor: '#1e293b'
                        }}
                      >
                        {stream.logo_url ? (
                          <Box
                            component="img"
                            src={stream.logo_url}
                            alt={stream.name}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#334155', color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
                            {stream.name.slice(0, 1).toUpperCase()}
                          </Box>
                        )}
                      </Box>

                      {/* Live Badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(4px)',
                          padding: '4px 8px',
                          borderRadius: 2,
                          border: stream.is_live
                            ? `1px solid ${serviceColor}`
                            : '1px solid rgba(255,255,255,0.2)',
                          zIndex: 2
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: stream.is_live ? serviceColor : '#94a3b8',
                            boxShadow: stream.is_live ? `0 0 10px ${serviceColor}` : 'none',
                            animation: stream.is_live ? 'pulse 2s infinite' : 'none',
                            '@keyframes pulse': {
                              '0%': { boxShadow: `0 0 0 0 ${serviceColor}70` },
                              '70%': { boxShadow: `0 0 0 6px ${serviceColor}00` },
                              '100%': { boxShadow: `0 0 0 0 ${serviceColor}00` }
                            }
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            letterSpacing: 0.5
                          }}
                        >
                          {stream.is_live ? 'LIVE' : 'OFFLINE'}
                        </Typography>
                      </Box>
                    </Box>

                    <CardContent sx={{ pt: 5, flexGrow: 1, zIndex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
                            {stream.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: serviceColor, fontWeight: 500, fontSize: '0.75rem', display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            {getServiceIconUrl((streaming_service || 'twitch') as StreamingService) && (
                              <Box component="img" src={getServiceIconUrl((streaming_service || 'twitch') as StreamingService)!} sx={{ width: 14, height: 14, mr: 0.5, objectFit: 'contain' }} />
                            )}
                            {getServiceName((streaming_service || 'twitch') as StreamingService)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Description / Bio */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.85rem',
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: 40 // Fixed height for 2 lines
                        }}
                      >
                        {stream.description || 'Sin descripción disponible.'}
                      </Typography>

                      {/* Recent Categories / Tags */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 'auto' }}>
                        {stream.categories && stream.categories.length > 0 ? (
                          stream.categories.slice(0, 3).map((cat) => (
                            <Chip
                              key={cat.id}
                              label={cat.name}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: alpha(serviceColor, 0.1),
                                color: alpha(serviceColor, 0.9),
                                borderColor: alpha(serviceColor, 0.2),
                                borderWidth: 1,
                                borderStyle: 'solid'
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
                              bgcolor: 'rgba(255,255,255,0.05)',
                              color: 'rgba(255,255,255,0.5)',
                            }}
                          />
                        )}
                      </Box>
                    </CardContent>

                    {/* Action Footer */}
                    <Box
                      sx={{
                        p: 1.5,
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        bgcolor: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        justifyContent: 'flex-end'
                      }}
                    >
                      <Button
                        size="small"
                        endIcon={<LiveTv fontSize="small" />}
                        sx={{
                          color: stream.is_live ? '#fff' : 'rgba(255,255,255,0.5)',
                          backgroundColor: stream.is_live ? serviceColor : 'transparent',
                          '&:hover': {
                            backgroundColor: stream.is_live ? alpha(serviceColor, 0.8) : 'rgba(255,255,255,0.1)',
                          },
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          px: 2,
                          borderRadius: 2
                        }}
                      >
                        {stream.is_live ? 'VER STREAM' : 'VISITAR CANAL'}
                      </Button>
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
