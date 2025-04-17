'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Box, IconButton, Modal, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DoneIcon from '@mui/icons-material/Done';

interface YouTubePlayerContainerProps {
  videoId: string;
  open: boolean;
  onClose: () => void;
}

const YouTubePlayerContainerComponent: React.FC<YouTubePlayerContainerProps> = ({ videoId, open, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const offset = useRef({ x: 0, y: 0 });

  const snapThreshold = 100;

  const handleMinimize = () => setIsMinimized(true);
  const handleMaximize = () => setIsMinimized(false);
  const handleStartMove = () => setIsMoving(true);
  const handleEndMove = () => setIsMoving(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (!isMoving) return;
    setDragging(true);
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (!isMoving) return;
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
    if (!dragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      handleMove(touch.clientX, touch.clientY);
    }
  }, [dragging, handleMove]);

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
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [handleMouseMove, handleEnd]);

  // 🔥 Manejar touchmove manualmente
  useEffect(() => {
    if (isMoving) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
    } else {
      document.removeEventListener('touchmove', handleTouchMove);
    }
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMoving, handleTouchMove]);

  const iframeElement = useMemo(() => (
    <iframe
      ref={iframeRef}
      width="100%"
      height="100%"
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
      frameBorder="0"
      allow="autoplay; encrypted-media"
      allowFullScreen
      style={{ borderRadius: 8 }}
    />
  ), [videoId]);

  if (!open) return null;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Box
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      sx={{
        position: 'fixed',
        top: isMinimized ? position.y : '50%',
        left: isMinimized ? position.x : '50%',
        transform: isMinimized ? 'none' : 'translate(-50%, -50%)',
        width: isMinimized ? 340 : '80%',
        maxWidth: isMinimized ? undefined : 800,
        height: isMinimized ? 200 : 500,
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 24,
        p: 2,
        overflow: 'hidden',
        zIndex: 1300,
        userSelect: dragging ? 'none' : 'auto',
        touchAction: isMoving ? 'none' : 'auto',
        cursor: isMoving ? 'move' : 'default',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
      }}
    >
      {children}
    </Box>
  );

  const Controls = () => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {isMinimized ? (
          <IconButton onClick={handleMaximize} size="small" sx={{ bgcolor: 'white' }}>
            <CropSquareIcon fontSize="small" />
          </IconButton>
        ) : (
          <IconButton onClick={handleMinimize} size="small" sx={{ bgcolor: 'white' }}>
            <CropSquareIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'white' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Botón mover solo en mobile */}
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 1 }}>
        {!isMoving ? (
          <Button
            onClick={handleStartMove}
            startIcon={<DragIndicatorIcon />}
            variant="contained"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Mover
          </Button>
        ) : (
          <Button
            onClick={handleEndMove}
            startIcon={<DoneIcon />}
            variant="contained"
            size="small"
            color="success"
            sx={{ textTransform: 'none' }}
          >
            Listo
          </Button>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {isMinimized ? (
        <Wrapper>
          <Controls />
          <Box sx={{ flexGrow: 1, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
            {iframeElement}
          </Box>
        </Wrapper>
      ) : (
        <Modal open={open} onClose={onClose} disableEnforceFocus disableAutoFocus>
          <Wrapper>
            <Controls />
            <Box sx={{ flexGrow: 1, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
              {iframeElement}
            </Box>
          </Wrapper>
        </Modal>
      )}
    </>
  );
};

export const YouTubePlayerContainer = React.memo(YouTubePlayerContainerComponent, (prevProps, nextProps) => {
  return prevProps.videoId === nextProps.videoId && prevProps.open === nextProps.open;
});
