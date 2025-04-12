import { Panelist } from './panelist';
import { Channel } from './channel';

export interface Program {
  id: number;
  name: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  channel_id: number;
  channel?: Channel;
  logo_url: string | null;
  youtube_url: string | null;
  created_at: string;
  updated_at: string;
}