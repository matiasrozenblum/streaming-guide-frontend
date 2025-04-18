import { Channel } from './channel';
import { Panelist } from './panelist';

export interface Program {
  id: number;
  name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  channel_id?: number;
  channel?: Channel;
  panelists?: Panelist[];
  logo_url?: string;
  youtube_url?: string;
  created_at: string;
  updated_at: string;
}