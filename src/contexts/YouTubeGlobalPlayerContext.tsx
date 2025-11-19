'use client';

import React, { createContext, useContext, useState } from 'react';
import { event as gaEvent } from '@/lib/gtag';
import Clarity from '@microsoft/clarity';

export type StreamingService = 'youtube' | 'twitch' | 'kick';

interface StreamingPlayerData {
  service: StreamingService;
  embedPath: string; // For YouTube: videoId or "videoseries?list=PLAYLIST_ID", For Twitch/Kick: channel name
}

interface YouTubeGlobalPlayerContextType {
  playerData: StreamingPlayerData | null;
  open: boolean;
  minimized: boolean;
  openVideo: (videoId: string) => void;
  openPlaylist: (listId: string) => void;
  openStream: (service: StreamingService, channelName: string) => void;
  closePlayer: () => void;
  minimizePlayer: () => void;
  maximizePlayer: () => void;
}

const YouTubeGlobalPlayerContext = createContext<YouTubeGlobalPlayerContextType | undefined>(undefined);

export const YouTubePlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerData, setPlayerData] = useState<StreamingPlayerData | null>(null);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const openVideo = (id: string) => {
    setPlayerData({ service: 'youtube', embedPath: id });
    setOpen(true);
    setMinimized(false);
  };

  const openPlaylist = (listId: string) => {
    // "videoseries?list=" es exactamente lo que usaba /embed/videoseries?list=...
    setPlayerData({ service: 'youtube', embedPath: `videoseries?list=${listId}` });
    setOpen(true);
    setMinimized(false);
  };

  const openStream = (service: StreamingService, channelName: string) => {
    setPlayerData({ service, embedPath: channelName });
    setOpen(true);
    setMinimized(false);
  };

  const closePlayer = () => {
    setOpen(false);
    setPlayerData(null);
    setMinimized(false);
  };

  const minimizePlayer = () => {
    setMinimized(true);
    Clarity.event('minimize_youtube')
    gaEvent({
      action: 'minimize_youtube',
      params: {}
    });
  };

  const maximizePlayer = () => {
    setMinimized(false);
    Clarity.event('maximize_youtube')
    gaEvent({
      action: 'maximize_youtube',
      params: {}
    });
  };

  return (
    <YouTubeGlobalPlayerContext.Provider
      value={{
        playerData,
        open,
        minimized,
        openVideo,
        openPlaylist,
        openStream,
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
