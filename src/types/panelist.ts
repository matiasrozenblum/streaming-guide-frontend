import { Program } from './program';

export interface Panelist {
    id: string;
    name: string;
    avatar_url?: string; // opcional
    programs?: Program[];
  }