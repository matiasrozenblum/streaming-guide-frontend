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
  id: number;
  name: string;
  logo_url?: string | null;
  is_visible?: boolean;
  order?: number | null;
  services: StreamerService[];
  categories?: Array<{
    id: number;
    name: string;
    description?: string;
    color?: string;
    order?: number;
  }>;
  is_live?: boolean; // Live status from backend
}

// Frontend display interface (for compatibility with existing components)
export interface StreamerDisplay {
  id: string;
  name: string;
  displayName: string;
  services: StreamerService[];
  logoUrl?: string;
  description?: string;
  isLive?: boolean;
}

