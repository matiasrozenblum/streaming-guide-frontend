import { Schedule } from './schedule';

export interface Channel {
  id: number;
  name: string;
  description?: string;
  logo_url?: string | null;
  handle?: string | null;
  youtube_channel_id?: string | null;
  order?: number | null;
  is_visible?: boolean;
  background_color?: string | null;
  show_only_when_scheduled?: boolean;
  created_at?: string; // opcional si tu API devuelve esto
  updated_at?: string; // opcional si tu API devuelve esto
}

export interface ChannelWithSchedules {
  channel: {
    id: number;
    name: string;
    logo_url: string | null;
    stream_count?: number;
  };
  schedules: Schedule[];
}
