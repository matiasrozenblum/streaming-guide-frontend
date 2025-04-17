'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Box, IconButton, Modal } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import { useMediaQuery } from '@mui/material';

interface YouTubePlayerContainerProps {
  videoId: string;
  open: boolean;
  onClose: () => void;
}

const YouTubePlayerContainerComponent: React.FC<YouTubePlayerContainerProps> = ({ videoId, open, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const offset = useRef({ x: 0, y: 0 });

  const isMobile = useMediaQuery('(max-width:600px)');

  const snapThreshold = 100;
  const minimizedWidth = 340;
  const minimizedHeight = 200;
  const margin = 20;

  const handleMinimize = () => {
    setIsMinimized(true);

    // ✅ Al minimizar, en mobile o desktop, setear posición bottom right
    setPosition({
      x: window.innerWidth - minimizedWidth - margin,
      y: window.innerHeight - minimizedHeight - margin,
    });
  };

  const handleMaximize = () => setIsMinimized(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (isMobile) return; // No arrastrar en mobile
    setDragging(true);
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
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

    if (rect.left < snapThreshold) newX = margin;
    else if (windowWidth - (rect.left + rect.width) < snapThreshold) newX = windowWidth - rect.width - margin;

    if (rect.top < snapThreshold) newY = margin;
    else if (windowHeight - (rect.top + rect.height) < snapThreshold) newY = windowHeight - rect.height - margin;

    setPosition({ x: newX, y: newY });
  };

  useEffect(() => {
    if (isMobile) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [handleMouseMove, handleEnd, isMobile]);

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
      sx={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        transform: isMinimized ? 'none' : 'translate(-50%, -50%)',
        width: isMinimized ? minimizedWidth : '80%',
        maxWidth: isMinimized ? undefined : 800,
        height: isMinimized ? minimizedHeight : 500,
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 24,
        p: 2,
        overflow: 'hidden',
        zIndex: 1300,
        userSelect: dragging ? 'none' : 'auto',
        cursor: dragging ? 'grabbing' : 'default',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
      }}
    >
      {children}
    </Box>
  );

  const Controls = () => (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
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
