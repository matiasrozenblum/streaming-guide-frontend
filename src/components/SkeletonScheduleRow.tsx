'use client';

import { Box, Skeleton, useTheme, useMediaQuery } from '@mui/material';
import { useLayoutValues } from '@/constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useMemo } from 'react';

export const SkeletonScheduleRow = () => {
    const theme = useTheme();
    const { mode } = useThemeContext();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { channelLabelWidth, rowHeight, pixelsPerMinute } = useLayoutValues();

    // Memoize the random blocks so they don't jump around on re-renders
    const blocks = useMemo(() => {
        // Generate 8 to 12 random blocks across 24h timeline
        const numBlocks = Math.floor(Math.random() * 5) + 8;
        const MAX_MIN = 24 * 60; // 24 hours
        const DURS = [60, 90, 120, 180];
        const generatedBlocks = [];

        // Simple deterministic sequential generation for skeletons so they look structured
        let currentStart = Math.floor(Math.random() * 120); // Start somewhere in the first 2 hours

        for (let i = 0; i < numBlocks; i++) {
            const dur = DURS[Math.floor(Math.random() * DURS.length)];
            // Add a random gap between 0 and 60 mins
            const gap = Math.floor(Math.random() * 60);

            generatedBlocks.push({ start: currentStart, dur });
            currentStart += dur + gap;
            if (currentStart > MAX_MIN) break;
        }

        return generatedBlocks;
    }, []);

    return (
        <Box
            display="flex"
            alignItems="center"
            borderBottom={`1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`}
            position="relative"
            height={`${rowHeight}px`}
        >
            {/* Sticky Channel Skeleton */}
            <Box
                width={`${channelLabelWidth}px`}
                minWidth={`${channelLabelWidth}px`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="sticky"
                left={0}
                bgcolor={mode === 'light' ? 'white' : '#1e293b'}
                height="100%"
                zIndex={6}
                sx={{
                    borderRight: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`,
                    boxShadow: mode === 'light'
                        ? '2px 0 4px rgba(0,0,0,0.05)'
                        : '2px 0 4px rgba(0,0,0,0.2)',
                }}
            >
                <Skeleton
                    variant="rounded"
                    width={isMobile ? 112 : 130}
                    height={isMobile ? 50 : 68}
                    sx={{
                        background: mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                    }}
                />
            </Box>

            {/* Skeletons for Programs */}
            <Box position="relative" flex="1" height="100%">
                {blocks.map((b, i) => (
                    <Box
                        key={i}
                        sx={{
                            position: 'absolute',
                            left: `${b.start * pixelsPerMinute + 2}px`,
                            top: 2,
                            width: `${b.dur * pixelsPerMinute - 4}px`,
                            height: `${rowHeight - 4}px`,
                            borderRadius: '8px',
                            bgcolor: mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            pl: 2,
                        }}
                    >
                        <Skeleton
                            variant="rounded"
                            width={isMobile ? Math.min(b.dur * pixelsPerMinute * 0.5, 80) : Math.min(b.dur * pixelsPerMinute * 0.6, 120)}
                            height={isMobile ? 12 : 16}
                            sx={{
                                bgcolor: mode === 'light' ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.09)',
                                borderRadius: '8px'
                            }}
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
};
