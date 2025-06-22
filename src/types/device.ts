export interface Device {
  id: string;
  deviceId: string;
  deviceName: string | null;
  deviceType: string | null;
  userAgent: string | null;
  lastSeen: string | null;
} 