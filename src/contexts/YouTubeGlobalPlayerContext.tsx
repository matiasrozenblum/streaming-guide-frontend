'use client';

import React, { createContext, useContext, useState } from 'react';
import { event as gaEvent } from '@/lib/gtag';
import Clarity from '@microsoft/clarity';
import type { ZapItem } from '@/types/zap';
import { parseStreamUrl } from '@/utils/parseStreamUrl';

export type StreamingService = 'youtube' | 'twitch' | 'kick';

export interface ChannelInfo {
  channelId: number;
  channelName: string;
  channelLogo?: string | null;
  channelBackgroundColor?: string | null;
  logoShape?: 'rect' | 'square';
}

interface StreamingPlayerData {
  service: StreamingService;
  embedPath: string;
  channelInfo?: ChannelInfo;
}

interface YouTubeGlobalPlayerContextType {
  playerData: StreamingPlayerData | null;
  open: boolean;
  minimized: boolean;
  zapList: ZapItem[];
  setZapList: (list: ZapItem[]) => void;
  openVideo: (videoId: string, channelInfo?: ChannelInfo) => void;
  openPlaylist: (listId: string, channelInfo?: ChannelInfo) => void;
  openStream: (service: StreamingService, channelName: string, channelInfo?: ChannelInfo) => void;
  zapToChannel: (item: ZapItem) => void;
  closePlayer: () => void;
  minimizePlayer: () => void;
  maximizePlayer: () => void;
}

const YouTubeGlobalPlayerContext = createContext<YouTubeGlobalPlayerContextType | undefined>(undefined);

export const YouTubePlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerData, setPlayerData] = useState<StreamingPlayerData | null>(null);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [zapList, setZapList] = useState<ZapItem[]>([]);

  const openVideo = (id: string, channelInfo?: ChannelInfo) => {
    setPlayerData({ service: 'youtube', embedPath: id, channelInfo });
    setOpen(true);
    setMinimized(false);
  };

  const openPlaylist = (listId: string, channelInfo?: ChannelInfo) => {
    setPlayerData({ service: 'youtube', embedPath: `videoseries?list=${listId}`, channelInfo });
    setOpen(true);
    setMinimized(false);
  };

  const openStream = (service: StreamingService, channelName: string, channelInfo?: ChannelInfo) => {
    setPlayerData({ service, embedPath: channelName, channelInfo });
    setOpen(true);
    setMinimized(false);
  };

  const zapToChannel = (item: ZapItem) => {
    if (!item.videoUrl) return;
    const parsed = parseStreamUrl(item.videoUrl);
    if (!parsed) return;

    const channelInfo: ChannelInfo = {
      channelId: item.id,
      channelName: item.name,
      channelLogo: item.logoUrl,
      channelBackgroundColor: item.backgroundColor,
      logoShape: item.logoShape,
    };

    setPlayerData({ service: parsed.service, embedPath: parsed.embedPath, channelInfo });
  };

  const closePlayer = () => {
    setOpen(false);
    setPlayerData(null);
    setMinimized(false);
  };

  const minimizePlayer = () => {
    setMinimized(true);
    try { Clarity.event('minimize_youtube'); } catch { /* Clarity not yet loaded */ }
    gaEvent({ action: 'minimize_youtube', params: {} });
  };

  const maximizePlayer = () => {
    setMinimized(false);
    try { Clarity.event('maximize_youtube'); } catch { /* Clarity not yet loaded */ }
    gaEvent({ action: 'maximize_youtube', params: {} });
  };

  return (
    <YouTubeGlobalPlayerContext.Provider
      value={{
        playerData,
        open,
        minimized,
        zapList,
        setZapList,
        openVideo,
        openPlaylist,
        openStream,
        zapToChannel,
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
