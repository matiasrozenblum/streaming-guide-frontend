import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Box, IconButton, Modal } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CropSquareIcon from '@mui/icons-material/CropSquare';

interface YouTubePlayerContainerProps {
  videoId: string;
  open: boolean;
  onClose: () => void;
}

const YouTubePlayerContainerComponent: React.FC<YouTubePlayerContainerProps> = ({ videoId, open, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const offset = useRef({ x: 0, y: 0 });

  const snapThreshold = 100;

  const handleMinimize = () => setIsMinimized(true);
  const handleMaximize = () => setIsMinimized(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setDragging(true);
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragging) {
      setPosition({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
      });
    }
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
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
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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
      onClick={(e) => e.stopPropagation()}
      sx={{
        position: 'fixed',
        top: isMinimized ? position.y : '50%',
        left: isMinimized ? position.x : '50%',
        transform: isMinimized ? 'none' : 'translate(-50%, -50%)',
        transition: 'top 0.3s ease, left 0.3s ease, transform 0.3s ease',
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
        cursor: isMinimized ? 'move' : 'default',
        display: 'flex',
        flexDirection: 'column',
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
