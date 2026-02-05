'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function StatusBarManager() {
    const { mode } = useThemeContext();

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            const setStatusBarStyle = async () => {
                try {
                    // 1. Make status bar transparent (overlay)
                    await StatusBar.setOverlaysWebView({ overlay: true });

                    // 2. Set style based on theme (Dark = white text, Light = dark text)
                    const style = mode === 'dark' ? Style.Dark : Style.Light;
                    await StatusBar.setStyle({ style });

                    // Debug log
                    console.log(`📱 Status Bar set to ${mode === 'dark' ? 'Dark' : 'Light'} style with Overlay`);
                } catch (error) {
                    console.warn('StatusBar plugin not available or failed:', error);
                }
            };

            setStatusBarStyle();
        }
    }, [mode]);

    return null; // Logic only component
}
