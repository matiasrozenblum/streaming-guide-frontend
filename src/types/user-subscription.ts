import { Program } from './program';

export interface UserSubscription {
  id: string;
  program: Program;
  isActive: boolean;
} 