import { Program } from './program';
import { Channel } from './channel';

export interface Schedule {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  program: Program & { channel: Channel };
}