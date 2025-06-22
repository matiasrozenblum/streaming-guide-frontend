import { Program } from './program';

export interface Panelist {
    id: number;
    name: string;
    avatar_url?: string; // opcional
    programs?: Program[];
  }