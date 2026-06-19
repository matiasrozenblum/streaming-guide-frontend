'use client';

import { Box, IconButton, Typography, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { useYouTubePlayer } from '@/contexts/YouTubeGlobalPlayerContext';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ZapCard } from './ZapCard';
import { ZapSidePanel } from './ZapSidePanel';

const PLAYER_HEIGHT_DESKTOP = 500;

function getLogoBg(bg?: string | null): React.CSSProperties {
  if (!bg) return { backgroundColor: '#FFFFFF' };
  if (bg.startsWith('linear-gradient')) return { background: bg };
  if (bg.includes('gradient')) return { backgroundColor: '#FFFFFF' };
  return { backgroundColor: bg };
}

export const YouTubeGlobalPlayer = () => {
  const {
    playerData,
    open,
    minimized,
    zapList,
    closePlayer,
    minimizePlayer,
    maximizePlayer,
    zapToChannel,
  } = useYouTubePlayer();

  const isMobile = useMediaQuery('(max-width:600px)');
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [zapOpen, setZapOpen] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  // Kick auto-retry: reload the iframe every KICK_RETRY_DELAY_MS until the player
  // signals it's working (postMessage from kick.com) or MAX_KICK_RETRIES is reached.
  const [kickIframeKey, setKickIframeKey] = useState(0);
  const kickRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kickRetryCount = useRef(0);
  const kickSucceeded = useRef(false);
  const MAX_KICK_RETRIES = 3;
  const KICK_RETRY_DELAY_MS = 4000;

  const minimizedWidth = isMobile ? 300 : 340;
  const minimizedHeight = isMobile ? 170 : 200;
  const margin = 20;
  const paddingCompensation = 32;

  useEffect(() => {
    if (minimized) setZapOpen(false);
  }, [minimized]);

  useEffect(() => {
    if (!open) setZapOpen(false);
  }, [open]);

  const { aboveItems, belowItems, panelItems, currentChannelId } = useMemo(() => {
    const currentId = playerData?.channelInfo?.channelId;
    // Only channels currently airing live are zappable — the current channel is
    // always included regardless of its live state, since it's actively playing.
    const isZappable = (z: typeof zapList[number]) => (z.isLive && z.videoUrl !== null) || z.id === currentId;

    const panelItems = zapList.filter(isZappable);

    if (!currentId) return { aboveItems: [], belowItems: [], panelItems, currentChannelId: undefined };

    const idx = zapList.findIndex((z) => z.id === currentId);
    if (idx === -1) return { aboveItems: [], belowItems: zapList.filter(isZappable), panelItems, currentChannelId: currentId };

    // Mobile cards: split at current channel index (current channel itself not shown in cards)
    const above = zapList.slice(0, idx).filter(isZappable);
    const below = zapList.slice(idx + 1).filter(isZappable);
    return { aboveItems: above, belowItems: below, panelItems, currentChannelId: currentId };
  }, [zapList, playerData?.channelInfo?.channelId]);

  const hasZapItems = panelItems.length > 1 || aboveItems.length > 0 || belowItems.length > 0;

  const moveTo = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragging) return;
      const clampedX = Math.max(0, Math.min(clientX - offset.current.x, window.innerWidth - minimizedWidth));
      const clampedY = Math.max(0, Math.min(clientY - offset.current.y, window.innerHeight - minimizedHeight));
      setPosition({ x: clampedX, y: clampedY });
    },
    [dragging, minimizedWidth, minimizedHeight],
  );

  const handleMouseUp = useCallback(() => {
    if (dragging) setDragging(false);
  }, [dragging]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => moveTo(e.clientX, e.clientY),
    [moveTo],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!dragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      moveTo(touch.clientX, touch.clientY);
    },
    [dragging, moveTo],
  );

  useEffect(() => {
    if (minimized) {
      setPosition(
        isMobile
          ? {
              x: (window.innerWidth - minimizedWidth) / 2,
              y: window.innerHeight - minimizedHeight - margin - paddingCompensation,
            }
          : {
              x: window.innerWidth - minimizedWidth - margin,
              y: window.innerHeight - minimizedHeight - margin - paddingCompensation,
            },
      );
    }
  }, [minimized, isMobile, minimizedWidth, minimizedHeight]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!minimized) return;
    if ((e.target as HTMLElement).closest('button')) return;
    setDragging(true);
    offset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!minimized) return;
    if ((e.target as HTMLElement).closest('button')) return;
    const touch = e.touches[0];
    setDragging(true);
    offset.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
  };

  useEffect(() => {
    if (!open || !dragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [dragging, open, handleMouseMove, handleMouseUp, handleTouchMove]);

  useEffect(() => {
    const handler = (e: TouchEvent) => e.preventDefault();
    if (dragging) document.addEventListener('touchmove', handler, { passive: false });
    return () => document.removeEventListener('touchmove', handler);
  }, [dragging]);

  // Kick auto-retry: when a Kick stream opens, reload the iframe every
  // KICK_RETRY_DELAY_MS up to MAX_KICK_RETRIES times. If the Kick player
  // emits a postMessage we consider it successfully started and stop.
  useEffect(() => {
    if (!open || playerData?.service !== 'kick') {
      if (kickRetryTimer.current) clearTimeout(kickRetryTimer.current);
      kickRetryCount.current = 0;
      kickSucceeded.current = false;
      setKickIframeKey(0);
      return;
    }

    kickRetryCount.current = 0;
    kickSucceeded.current = false;
    setKickIframeKey(0);

    const scheduleRetry = () => {
      if (kickRetryTimer.current) clearTimeout(kickRetryTimer.current);
      kickRetryTimer.current = setTimeout(() => {
        if (kickSucceeded.current) return;
        kickRetryCount.current += 1;
        setKickIframeKey((k) => k + 1);
        if (kickRetryCount.current < MAX_KICK_RETRIES) scheduleRetry();
      }, KICK_RETRY_DELAY_MS);
    };

    scheduleRetry();

    return () => {
      if (kickRetryTimer.current) clearTimeout(kickRetryTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, playerData?.service, playerData?.embedPath]);

  // Stop retrying once Kick's player emits any postMessage (sign it's running)
  useEffect(() => {
    const handleKickMessage = (e: MessageEvent) => {
      if (typeof e.origin === 'string' && e.origin.includes('kick.com')) {
        kickSucceeded.current = true;
        if (kickRetryTimer.current) {
          clearTimeout(kickRetryTimer.current);
          kickRetryTimer.current = null;
        }
      }
    };
    window.addEventListener('message', handleKickMessage);
    return () => window.removeEventListener('message', handleKickMessage);
  }, []);

  if (!open || !playerData) return null;

  // Build embed src.
  // NOTE: Do NOT add enablejsapi=1 — causes heartbeat postMessages that freeze player after ~3 min.
  let src = '';
  if (playerData.service === 'youtube') {
    const baseUrl = `https://www.youtube.com/embed/${playerData.embedPath}`;
    src = playerData.embedPath.includes('?') ? `${baseUrl}&autoplay=1` : `${baseUrl}?autoplay=1`;
  } else if (playerData.service === 'twitch') {
    const parent = typeof window !== 'undefined' ? window.location.hostname : '';
    src = `https://player.twitch.tv/?channel=${playerData.embedPath}&parent=${parent}&autoplay=true`;
  } else if (playerData.service === 'kick') {
    src = `https://player.kick.com/${playerData.embedPath}?autoplay=true`;
  }

  const isStreamingService = playerData.service === 'twitch' || playerData.service === 'kick';

  const getDimensions = () => {
    if (minimized) return { width: minimizedWidth, height: minimizedHeight };
    if (isMobile) return { width: '95%', height: isStreamingService ? '54vh' : '52vh' };
    return { width: '80%', maxWidth: 800, height: PLAYER_HEIGHT_DESKTOP };
  };

  const dimensions = getDimensions();

  // Side panel open state (desktop only)
  const sidePanelOpen = !isMobile && zapOpen && hasZapItems && !minimized;

  // Mobile cards
  const upperVisible = isMobile && zapOpen && aboveItems.length > 0 && !minimized;
  const lowerVisible = isMobile && zapOpen && belowItems.length > 0 && !minimized;

  const playerBorderRadius = minimized
    ? '12px'
    : isMobile
      ? `${upperVisible ? 0 : 12}px ${upperVisible ? 0 : 12}px ${lowerVisible ? 0 : 12}px ${lowerVisible ? 0 : 12}px`
      : `${sidePanelOpen ? 0 : 12}px 12px 12px ${sidePanelOpen ? 0 : 12}px`;

  const channelInfo = playerData.channelInfo;

  return (
    <>
      {/* Dark overlay for maximized state */}
      {!minimized && (
        <Box
          onClick={closePlayer}
          sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.75)', zIndex: 1999 }}
        />
      )}

      {/* Drag capture overlay (minimized + dragging) */}
      {minimized && dragging && (
        <Box
          onTouchStart={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
          onTouchEnd={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100dvh',
            backgroundColor: 'rgba(0,0,0,0.2)',
            zIndex: 1999,
          }}
        />
      )}

      {/*
        Desktop side panel: separate fixed element, positioned so its right edge
        aligns with the player's left edge.
        Player center: left 50%, translate(-50%). Player half-width = min(40vw, 400px).
        Player left edge from viewport right = 50vw + min(40vw, 400px).
        → panel right: calc(50% + min(40vw, 400px))
      */}
      {!minimized && !isMobile && (
        <Box
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          sx={{
            position: 'fixed',
            top: '50%',
            right: 'calc(50% + min(40vw, 400px))',
            transform: 'translateY(-50%)',
            height: `${PLAYER_HEIGHT_DESKTOP}px`,
            width: sidePanelOpen ? '200px' : 0,
            overflow: 'hidden',
            transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: sidePanelOpen ? 'auto' : 'none',
            zIndex: 2000,
          }}
        >
          <ZapSidePanel
            items={panelItems}
            currentId={currentChannelId}
            isOpen={sidePanelOpen}
            playerHeight={PLAYER_HEIGHT_DESKTOP}
            onZap={zapToChannel}
          />
        </Box>
      )}

      {/* Main player outer wrapper — always flex-column, same layout as pre-zap */}
      <Box
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        sx={{
          position: 'fixed',
          top: minimized ? position.y : '50%',
          left: minimized ? position.x : '50%',
          transform: minimized ? 'none' : 'translate(-50%, -50%)',
          width: dimensions.width,
          maxWidth: (dimensions as { maxWidth?: number }).maxWidth,
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
          cursor: dragging ? 'grabbing' : 'default',
        }}
      >
        {/* Mobile: card above player */}
        {!minimized && isMobile && (
          <ZapCard items={aboveItems} position="above" isOpen={zapOpen} onZap={zapToChannel} />
        )}

        {/* Player box */}
        <Box
          sx={{
            bgcolor: '#1E293B',
            borderRadius: playerBorderRadius,
            boxShadow: 24,
            p: isMobile && !minimized ? 1 : 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: dimensions.height,
            transition: 'border-radius 200ms ease',
          }}
        >
          {/* Controls bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: isMobile && !minimized ? 0.5 : 1,
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            {/* Zap toggle */}
            {!minimized && hasZapItems && (
              <IconButton
                aria-label={zapOpen ? 'Cerrar lista de canales' : 'Abrir lista de canales'}
                onClick={() => setZapOpen((v) => !v)}
                size="small"
                sx={{
                  color: zapOpen ? '#3b82f6' : 'rgba(255,255,255,0.65)',
                  '&:hover': { color: zapOpen ? '#60a5fa' : 'rgba(255,255,255,0.9)' },
                }}
              >
                <FormatListBulletedIcon fontSize="small" />
              </IconButton>
            )}

            {/* Channel / streamer mini-logo + name */}
            {!minimized && channelInfo && (
              <>
                {(() => {
                  const isSquare = channelInfo.logoShape === 'square';
                  return (
                    <Box
                      sx={{
                        width: isSquare ? 28 : 44,
                        height: 28,
                        borderRadius: isSquare ? '6px' : '4px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...(isSquare
                          ? { backgroundColor: '#1e293b' }
                          : getLogoBg(channelInfo.channelBackgroundColor)),
                      }}
                    >
                      {channelInfo.channelLogo && (
                        <Box
                          component="img"
                          src={channelInfo.channelLogo}
                          alt={channelInfo.channelName}
                          sx={{ width: '100%', height: '100%', objectFit: isSquare ? 'cover' : 'contain' }}
                        />
                      )}
                    </Box>
                  );
                })()}
                <Typography
                  sx={{
                    color: '#e2e8f0',
                    fontSize: '13px',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 180,
                  }}
                >
                  {channelInfo.channelName}
                </Typography>
              </>
            )}

            <Box sx={{ flex: 1 }} />

            <IconButton
              aria-label={minimized ? 'Maximizar reproductor' : 'Minimizar reproductor'}
              onClick={minimized ? maximizePlayer : minimizePlayer}
              size="small"
              sx={{ color: 'rgba(255,255,255,0.65)', '&:hover': { color: '#fff' } }}
            >
              <CropSquareIcon fontSize="small" />
            </IconButton>

            <IconButton
              aria-label="Cerrar reproductor"
              onClick={closePlayer}
              size="small"
              sx={{ color: 'rgba(255,255,255,0.65)', '&:hover': { color: '#fff' } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* iframe */}
          <Box sx={{ flexGrow: 1, width: '100%', borderRadius: 2, overflow: 'hidden', minHeight: 0 }}>
            <iframe
              key={playerData.service === 'kick' ? kickIframeKey : undefined}
              width="100%"
              height="100%"
              src={src}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ borderRadius: 8 }}
            />
          </Box>
        </Box>

        {/* Mobile: card below player */}
        {!minimized && isMobile && (
          <ZapCard items={belowItems} position="below" isOpen={zapOpen} onZap={zapToChannel} />
        )}
      </Box>
    </>
  );
};
