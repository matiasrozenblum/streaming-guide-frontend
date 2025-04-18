'use client';

import React, { createContext, useContext, useState } from 'react';

interface YouTubeGlobalPlayerContextType {
  videoId: string | null;
  open: boolean;
  minimized: boolean;
  openPlayer: (videoId: string) => void;
  closePlayer: () => void;
  minimizePlayer: () => void;
  maximizePlayer: () => void;
}

const YouTubeGlobalPlayerContext = createContext<YouTubeGlobalPlayerContextType | undefined>(undefined);

export const YouTubePlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    <YouTubeGlobalPlayerContext.Provider
      value={{ videoId, open, minimized, openPlayer, closePlayer, minimizePlayer, maximizePlayer }}
    >
      {children}
    </YouTubeGlobalPlayerContext.Provider>
  );
};

export const useYouTubePlayer = () => {
  const context = useContext(YouTubeGlobalPlayerContext);
  if (!context) {
    throw new Error('useYouTubePlayer must be used within a YouTubePlayerProvider');
  }
  return context;
};
