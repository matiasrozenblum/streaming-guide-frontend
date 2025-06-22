import { Program } from './program';

export enum NotificationMethod {
  PUSH = 'push',
  EMAIL = 'email',
  BOTH = 'both',
}

export interface UserSubscription {
  id: string;
  program: Program;
  notificationMethod: NotificationMethod;
  isActive: boolean;
} 