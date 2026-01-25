import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.laguiadelstreaming.app',
  appName: 'La Guía del Streaming',
  webDir: 'out',
  server: {
    // Replace with your local IP for testing on physical device (e.g., 'http://192.168.1.5:3000')
    // Use 'http://10.0.2.2:3000' for Android Emulator
    // Use 'http://localhost:3000' for iOS Simulator
    // url: 'http://localhost:3000', 
    url: 'https://staging.laguiadelstreaming.com',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
