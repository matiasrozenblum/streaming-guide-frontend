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
  created_at?: string; // opcional si tu API devuelve esto
  updated_at?: string; // opcional si tu API devuelve esto
}

export interface ChannelWithSchedules {
  channel: {
    id: number;
    name: string;
    logo_url: string | null;
  };
  schedules: Schedule[];
}
