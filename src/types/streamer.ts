export enum StreamingService {
  TWITCH = 'twitch',
  KICK = 'kick',
  YOUTUBE = 'youtube',
}

export interface StreamerService {
  service: StreamingService;
  url: string;
  username?: string;
}

export interface Streamer {
  id: string;
  name: string;
  displayName: string;
  services: StreamerService[];
  logoUrl?: string;
  description?: string;
  isLive?: boolean;
}

