'use client';

import { Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import { useYouTubePlayer } from '../contexts/YouTubeGlobalPlayerContext';
import { useRef, useEffect, useState, useCallback } from 'react';

export const YouTubeGlobalPlayer = () => {
  const { videoId, open, minimized, closePlayer, minimizePlayer, maximizePlayer } = useYouTubePlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  const snapThreshold = 100;

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

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (dragging) {
      setPosition({
        x: clientX - offset.current.x,
        y: clientY - offset.current.y,
      });
    }
  }, [dragging]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      handleMove(touch.clientX, touch.clientY);
    }
  }, [handleMove]);

  const handleEnd = useCallback(() => {
    if (dragging) {
      setDragging(false);
      snapToEdge();
    }
  }, [dragging]);

  const snapToEdge = () => {
    if (!containerRef.current) return;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const rect = containerRef.current.getBoundingClientRect();

    let newX = position.x;
    let newY = position.y;

    if (rect.left < snapThreshold) newX = 20;
    else if (windowWidth - (rect.left + rect.width) < snapThreshold) newX = windowWidth - rect.width - 20;

    if (rect.top < snapThreshold) newY = 20;
    else if (windowHeight - (rect.top + rect.height) < snapThreshold) newY = windowHeight - rect.height - 20;

    setPosition({ x: newX, y: newY });
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [handleMouseMove, handleTouchMove, handleEnd]);

  if (!open || !videoId) return null;

  return (
    <Box
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      sx={{
        position: 'fixed',
        top: minimized ? position.y : '50%',
        left: minimized ? position.x : '50%',
        transform: minimized ? 'none' : 'translate(-50%, -50%)',
        transition: 'top 0.3s ease, left 0.3s ease, transform 0.3s ease',
        width: minimized ? 340 : '80%',
        maxWidth: minimized ? undefined : 800,
        height: minimized ? 200 : 500,
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 24,
        p: 2,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        userSelect: dragging ? 'none' : 'auto',
        cursor: minimized ? 'move' : 'default',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
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
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          style={{ borderRadius: 8 }}
        />
      </Box>
    </Box>
  );
};
