import React, { ReactNode, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { motion, useAnimation, PanInfo } from 'framer-motion';

interface PullToRefreshWrapperProps {
    children: ReactNode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scrollRef?: React.RefObject<any>; // Ref to the scrollable element
}

export default function PullToRefreshWrapper({ children, scrollRef }: PullToRefreshWrapperProps) {
    const router = useRouter();
    const theme = useTheme();
    // Check if we are running on a native platform (iOS/Android)
    const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullY, setPullY] = useState(0);
    const controls = useAnimation();

    // Threshold to trigger refresh
    const TARGET_Y = 80;

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Keep spinner visible
        await controls.start({ y: TARGET_Y });

        // Trigger Next.js refresh
        router.refresh();

        // Wait for minimum time
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsRefreshing(false);
        // Animate back to closed
        await controls.start({ y: 0 });
        setPullY(0);
    };

    // If not native, render children directly
    if (!isNative) {
        return <>{children}</>;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onPan = (_: any, info: PanInfo) => {
        // console.log('PTR Pan:', info.delta.y);
        if (isRefreshing) return;

        // Check if we are at the top of the scroll container
        const scrollTop = scrollRef?.current?.scrollTop || 0;

        // Only allow pulling if we are at the top and pulling down
        if (scrollTop <= 1 && info.delta.y > 0) {
            const newY = pullY + info.delta.y * 0.5; // Add resistance
            if (newY > 0) {
                setPullY(newY);
                controls.set({ y: newY });
            }
        } else if (pullY > 0) {
            // Allow pulling back up to cancel
            const newY = Math.max(0, pullY + info.delta.y * 0.5);
            setPullY(newY);
            controls.set({ y: newY });
        }
    };

    const onPanEnd = () => {
        if (isRefreshing) return;

        if (pullY > TARGET_Y) {
            handleRefresh();
        } else {
            // Animate back to 0
            setPullY(0);
            controls.start({ y: 0 });
        }
    };

    return (
        <Box sx={{ position: 'relative', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Refresh Indicator */}
            <motion.div
                initial={{ y: 0 }}
                animate={controls}
                style={{
                    position: 'absolute',
                    top: -TARGET_Y, // Start hidden above
                    left: 0,
                    right: 0,
                    height: TARGET_Y,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                    pointerEvents: 'none' // Let touches pass through
                }}
            >
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: Math.min(pullY / TARGET_Y, 1)
                }}>
                    {isRefreshing ? (
                        <CircularProgress size={24} thickness={4} sx={{ color: theme.palette.mode === 'light' ? theme.palette.primary.main : '#fff' }} />
                    ) : (
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {pullY > TARGET_Y ? '⬆️ Suelta para actualizar' : '⬇️ Desliza para actualizar'}
                        </Typography>
                    )}
                </Box>
            </motion.div>

            {/* Content wrapper that handles the gestures */}
            <motion.div
                className="ptr-content"
                onPan={onPan}
                onPanEnd={onPanEnd}
                animate={controls}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ height: '100%', display: 'flex', flexDirection: 'column', touchAction: 'pan-y' }}
            >
                {children}
            </motion.div>
        </Box>
    );
}
