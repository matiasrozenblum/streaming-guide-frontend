'use client';

import React, { createContext, useContext, useState } from 'react';

interface YouTubePlayerContextProps {
  videoId: string | null;
  open: boolean;
  minimized: boolean;
  openPlayer: (videoId: string) => void;
  closePlayer: () => void;
  minimizePlayer: () => void;
  maximizePlayer: () => void;
}

const YouTubePlayerContext = createContext<YouTubePlayerContextProps | undefined>(undefined);

export const YouTubePlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const openPlayer = (id: string) => {
    setVideoId(id);
    setOpen(true);
    setMinimized(false);
  };

  const closePlayer = () => {
    setOpen(false);
    setVideoId(null);
    setMinimized(false);
  };

  const minimizePlayer = () => {
    setMinimized(true);
  };

  const maximizePlayer = () => {
    setMinimized(false);
  };

  return (
    <YouTubePlayerContext.Provider
      value={{ videoId, open, minimized, openPlayer, closePlayer, minimizePlayer, maximizePlayer }}
    >
      {children}
    </YouTubePlayerContext.Provider>
  );
};

export const useYouTubePlayer = () => {
  const context = useContext(YouTubePlayerContext);
  if (!context) {
    throw new Error('useYouTubePlayer must be used within a YouTubePlayerProvider');
  }
  return context;
};
