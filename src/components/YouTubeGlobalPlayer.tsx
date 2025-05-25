'use client';

import { Box, IconButton, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import { useYouTubePlayer } from '@/contexts/YouTubeGlobalPlayerContext';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';

export const YouTubeGlobalPlayer = () => {
  const { embedPath, open, minimized, closePlayer, minimizePlayer, maximizePlayer } = useYouTubePlayer();
  const isMobile = useMediaQuery('(max-width:600px)');
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  const minimizedWidth = isMobile ? 300 : 340;
  const minimizedHeight = isMobile ? 170 : 200;
  const margin = 20;
  const paddingCompensation = 32;

  const buttonBgColor = theme.palette.mode === 'dark' ? '#1e293b' : '#f5f5f5';

  const moveTo = useCallback((clientX: number, clientY: number) => {
    if (!dragging) return;
    
    const clampedX = Math.max(0, Math.min(clientX - offset.current.x, window.innerWidth - minimizedWidth));
    const clampedY = Math.max(0, Math.min(clientY - offset.current.y, window.innerHeight - minimizedHeight));
    
    setPosition({ x: clampedX, y: clampedY });
  }, [dragging, minimizedWidth, minimizedHeight]);
  
  const handleMouseUp = useCallback(() => {
    if (dragging) {
      setDragging(false);
    }
  }, [dragging]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    moveTo(e.clientX, e.clientY);
  }, [moveTo]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    moveTo(touch.clientX, touch.clientY);
  }, [dragging, moveTo]);

  useEffect(() => {
    if (minimized) {
      if (isMobile) {
        setPosition({
          x: (window.innerWidth - minimizedWidth) / 2,
          y: window.innerHeight - minimizedHeight - margin - paddingCompensation,
        });
      } else {
        setPosition({
          x: window.innerWidth - minimizedWidth - margin,
          y: window.innerHeight - minimizedHeight - margin - paddingCompensation,
        });
      }
    }
  }, [minimized, isMobile, minimizedWidth, minimizedHeight]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setDragging(true);
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const touch = e.touches[0];
    setDragging(true);
    offset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
  };

  useEffect(() => {
    if (!open) return;

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [dragging, open, handleMouseMove, handleMouseUp, handleTouchMove]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };
  
    if (dragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
    }
  
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [dragging]);

  if (!open || !embedPath) return null;

  const baseUrl = `https://www.youtube.com/embed/${embedPath}`;
  const src = embedPath.includes('?')
    ? `${baseUrl}&autoplay=1&enablejsapi=1`
    : `${baseUrl}?autoplay=1&enablejsapi=1`;

  return (
    <>
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
           backgroundColor: 'rgba(0, 0, 0, 0.2)',
           zIndex: 1999,
         }}
       />
      )}

      <Box
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        sx={{
          position: 'fixed',
          top: minimized ? position.y : '50%',
          left: minimized ? position.x : '50%',
          transform: minimized ? 'none' : 'translate(-50%, -50%)',
          width: minimized ? minimizedWidth : '80%',
          maxWidth: minimized ? undefined : 800,
          height: minimized ? minimizedHeight : 500,
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          p: 2,
          overflow: 'hidden',
          zIndex: 2000,
          userSelect: 'none',
          cursor: dragging ? 'grabbing' : 'default',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}>
          {minimized ? (
            <IconButton onClick={maximizePlayer} size="small" sx={{ bgcolor: buttonBgColor }}>
              <CropSquareIcon fontSize="small" />
            </IconButton>
          ) : (
            <IconButton onClick={minimizePlayer} size="small" sx={{ bgcolor: buttonBgColor }}>
              <CropSquareIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton onClick={closePlayer} size="small" sx={{ bgcolor: buttonBgColor }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
          <iframe
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
    </>
  );
};
