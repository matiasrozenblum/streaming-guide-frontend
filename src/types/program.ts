import { Panelist } from './panelist';

export interface Program {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  channelId: string;
  panelists?: Panelist[];
  logo_url?: string;
  youtube_url?: string;
}