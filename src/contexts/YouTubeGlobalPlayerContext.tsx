'use client';

import React, { createContext, useContext, useState } from 'react';
import { event as gaEvent } from '@/lib/gtag';
import Clarity from '@microsoft/clarity';

interface YouTubeGlobalPlayerContextType {
  embedPath: string | null;     // Aquí guardamos "VIDEO_ID" o "videoseries?list=PLAYLIST_ID"
  open: boolean;
  minimized: boolean;
  openVideo: (videoId: string) => void;
  openPlaylist: (listId: string) => void;
  closePlayer: () => void;
  minimizePlayer: () => void;
  maximizePlayer: () => void;
}

const YouTubeGlobalPlayerContext = createContext<YouTubeGlobalPlayerContextType | undefined>(undefined);

export const YouTubePlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [embedPath, setEmbedPath] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const openVideo = (id: string) => {
    setEmbedPath(id);
    setOpen(true);
    setMinimized(false);
  };

  const openPlaylist = (listId: string) => {
    // “videoseries?list=” es exactamente lo que usaba /embed/videoseries?list=...
    setEmbedPath(`videoseries?list=${listId}`);
    setOpen(true);
    setMinimized(false);
  };

  const closePlayer = () => {
    setOpen(false);
    setEmbedPath(null);
    setMinimized(false);
  };

  const minimizePlayer = () => {
    setMinimized(true);
    Clarity.event('minimize_youtube')
    gaEvent(
      'minimize_youtube',
      {}
    );
  };

  const maximizePlayer = () => {
    setMinimized(false);
    Clarity.event('maximize_youtube')
    gaEvent(
      'maximize_youtube',
      {}
    );
  };

  return (
    <YouTubeGlobalPlayerContext.Provider
      value={{
        embedPath,
        open,
        minimized,
        openVideo,
        openPlaylist,
        closePlayer,
        minimizePlayer,
        maximizePlayer,
      }}
    >
      {children}
    </YouTubeGlobalPlayerContext.Provider>
  );
};

export const useYouTubePlayer = () => {
  const ctx = useContext(YouTubeGlobalPlayerContext);
  if (!ctx) throw new Error('useYouTubePlayer must be used within a YouTubePlayerProvider');
  return ctx;
};
