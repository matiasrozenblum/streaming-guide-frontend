'use client';

import { Box, IconButton, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import { useYouTubePlayer } from '@/contexts/YouTubeGlobalPlayerContext';
import { useEffect, useRef, useState } from 'react';

export const YouTubeGlobalPlayer = () => {
  const { videoId, open, minimized, closePlayer, minimizePlayer, maximizePlayer } = useYouTubePlayer();
  const isMobile = useMediaQuery('(max-width:600px)');
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  const minimizedWidth = isMobile ? 300 : 340;
  const minimizedHeight = isMobile ? 170 : 200;
  const margin = 20;
  const paddingCompensation = 32;

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
    if (isMobile) return;
    if ((e.target as HTMLElement).closest('button')) return;
    setDragging(true);
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(false);
    }
  };

  useEffect(() => {
    if (isMobile) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, isMobile]);

  if (!open || !videoId) return null;

  return (
    <Box
      ref={containerRef}
      onMouseDown={handleMouseDown}
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
        cursor: isMobile ? 'default' : dragging ? 'grabbing' : 'default',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}>
        {minimized ? (
          <IconButton onClick={maximizePlayer} size="small" sx={{ bgcolor: 'white' }}>
            <CropSquareIcon fontSize="small" />
          </IconButton>
        ) : (
          <IconButton onClick={minimizePlayer} size="small" sx={{ bgcolor: 'white' }}>
            <CropSquareIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton onClick={closePlayer} size="small" sx={{ bgcolor: 'white' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          style={{ borderRadius: 8 }}
        />
      </Box>
    </Box>
  );
};
