'use client';

import React from 'react';
import { Box, Skeleton, useTheme, useMediaQuery } from '@mui/material';
import {
  PIXELS_PER_MINUTE,
  TIME_HEADER_HEIGHT,
  ROW_HEIGHT,
  CHANNEL_LABEL_WIDTH,
} from '@/constants/layout';

// Deterministic block positions – no Math.random() to avoid SSR hydration mismatches
const BLOCK_PATTERNS = [
  [{ left: '6%', width: '20%' }, { left: '40%', width: '25%' }],
  [{ left: '3%', width: '28%' }, { left: '52%', width: '18%' }],
  [{ left: '14%', width: '22%' }, { left: '48%', width: '22%' }],
  [{ left: '8%', width: '18%' }, { left: '58%', width: '20%' }],
  [{ left: '5%', width: '30%' }, { left: '45%', width: '15%' }],
  [{ left: '10%', width: '24%' }, { left: '50%', width: '22%' }],
  [{ left: '2%', width: '20%' }, { left: '38%', width: '28%' }],
  [{ left: '12%', width: '26%' }, { left: '55%', width: '18%' }],
];

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const CATEGORIES_DESKTOP = 6;
const CATEGORIES_MOBILE = 4;
const ROW_COUNT = 8;
const HOUR_COLUMNS = 10; // visible hour marks in the time header

export function HomePageSkeleton() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const channelLabelWidth = isMobile ? CHANNEL_LABEL_WIDTH.mobile : CHANNEL_LABEL_WIDTH.desktop;
  const rowHeight = isMobile ? ROW_HEIGHT.mobile : ROW_HEIGHT.desktop;
  const bannerHeight = isMobile ? 120 : 200;
  const catCount = isMobile ? CATEGORIES_MOBILE : CATEGORIES_DESKTOP;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)'
            : 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)',
        py: { xs: 1, sm: 2 },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: { xs: 2, sm: 3 },
          mb: { xs: 1, sm: 1.5 },
          flexShrink: 0,
          gap: 1.5,
        }}
      >
        {/* Logo icon */}
        <Skeleton variant="circular" width={isMobile ? 32 : 42} height={isMobile ? 32 : 42} />
        {/* Logo text */}
        <Skeleton
          variant="rectangular"
          width={isMobile ? 96 : 130}
          height={isMobile ? 28 : 36}
          sx={{ borderRadius: 1 }}
        />
        <Box flex={1} />
        {/* Nav tabs – desktop only */}
        {!isMobile && (
          <>
            <Skeleton variant="rectangular" width={82} height={30} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={94} height={30} sx={{ borderRadius: 1 }} />
            <Box flex={1} />
          </>
        )}
        {/* Right icons */}
        <Skeleton variant="circular" width={34} height={34} />
        <Skeleton variant="circular" width={34} height={34} />
      </Box>

      {/* ── Banner ── */}
      <Box
        sx={{
          px: { xs: 0, sm: 0 },
          pb: { xs: 1, sm: 2 },
          mx: { xs: 0, sm: 2 },
          flexShrink: 0,
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height={bannerHeight}
          sx={{ borderRadius: isMobile ? '12px' : '16px' }}
        />
      </Box>

      {/* ── Schedule card (day buttons + tabs + grid) ── */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          mx: { xs: 0, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden',
        }}
      >
        {/* Day buttons */}
        <Box
          display="flex"
          gap={1}
          px={2}
          pt={1.5}
          pb={1}
          sx={{ flexShrink: 0, overflow: 'hidden' }}
        >
          {DAYS.map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={isMobile ? 40 : 76}
              height={36}
              sx={{ borderRadius: '18px', flexShrink: 0 }}
            />
          ))}
        </Box>

        {/* Category tabs */}
        <Box
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          <Box display="flex" gap={isMobile ? 0.5 : 1} px={2} pb={0.5}>
            {Array.from({ length: catCount }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width={i === 0 ? 52 : isMobile ? 62 : 78}
                height={34}
                sx={{ borderRadius: 1 }}
              />
            ))}
          </Box>
        </Box>

        {/* Time header */}
        <Box
          display="flex"
          sx={{
            height: TIME_HEADER_HEIGHT,
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: channelLabelWidth,
              minWidth: channelLabelWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Skeleton variant="text" width={38} height={14} />
          </Box>
          <Box display="flex" flex={1} sx={{ overflow: 'hidden' }}>
            {Array.from({ length: HOUR_COLUMNS }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: PIXELS_PER_MINUTE * 60,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Skeleton variant="text" width={28} height={14} />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Channel rows */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {Array.from({ length: ROW_COUNT }).map((_, r) => {
            const blocks = BLOCK_PATTERNS[r % BLOCK_PATTERNS.length];
            return (
              <Box
                key={r}
                display="flex"
                sx={{
                  height: rowHeight,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                {/* Channel label */}
                <Box
                  sx={{
                    width: channelLabelWidth,
                    minWidth: channelLabelWidth,
                    borderRight: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 1,
                    flexShrink: 0,
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    width={channelLabelWidth * 0.65}
                    height={rowHeight * 0.55}
                    sx={{ borderRadius: 1 }}
                  />
                </Box>
                {/* Program blocks */}
                <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  {blocks.map((b, bi) => (
                    <Skeleton
                      key={bi}
                      variant="rectangular"
                      animation="wave"
                      sx={{
                        position: 'absolute',
                        top: '10%',
                        left: b.left,
                        width: b.width,
                        height: '80%',
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
