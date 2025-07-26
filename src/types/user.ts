import { Device } from './device';
import { UserSubscription } from './user-subscription';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
  gender?: 'male' | 'female' | 'non_binary' | 'rather_not_say';
  birthDate?: string;
  origin?: 'traditional' | 'google' | 'facebook';
  devices: Device[];
  subscriptions: UserSubscription[];
} 