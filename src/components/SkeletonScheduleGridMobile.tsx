'use client';

import React from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';
import { useLayoutValues } from '@/constants/layout';

interface Props {
  rowCount: number;
}

export const SkeletonScheduleGridMobile: React.FC<Props> = ({ rowCount }) => {
  const theme = useTheme();
  const {
    channelLabelWidth,
    timeHeaderHeight,
    rowHeight,
    pixelsPerMinute,
  } = useLayoutValues();

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const blocks = Array.from({ length: rowCount }).flatMap((_, r) => {
    const MAX_MIN = 24 * 60; // Up to 24 hours
    const DURS = [60, 90, 120, 180];
    const yTop = timeHeaderHeight +
      r * rowHeight + rowHeight * 0.34;
    const h = rowHeight - 1;

    const numBlocks = Math.floor(Math.random() * 5) + 8;
    const rowBlocks = [];
    let currentStart = Math.floor(Math.random() * 120);

    for (let i = 0; i < numBlocks; i++) {
      const dur = DURS[Math.floor(Math.random() * DURS.length)];
      const gap = Math.floor(Math.random() * 60);

      rowBlocks.push({
        top: yTop,
        left: channelLabelWidth + currentStart * pixelsPerMinute + 2,
        width: dur * pixelsPerMinute - 4,
        height: h,
        dur: dur,
      });

      currentStart += dur + gap;
      if (currentStart > MAX_MIN) break;
    }

    return rowBlocks;
  });

  return (
    <Box>
      {/* — Días arriba — */}
      <Box display="flex" gap={1} p={2} alignItems="center">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width={80}
            height={40}
            sx={{ borderRadius: theme.shape.borderRadius }}
          />
        ))}
        <Box flex="1" />
        <Skeleton
          variant="rectangular"
          width={100}
          height={40}
          sx={{ borderRadius: theme.shape.borderRadius }}
        />
      </Box>

      {/* — Category tabs skeleton — */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <Box display="flex" gap={1} p={1} alignItems="center">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={80}
              height={48}
              sx={{ borderRadius: theme.shape.borderRadius }}
            />
          ))}
        </Box>
      </Box>

      {/* — Header de horas — */}
      <Box display="flex" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ width: channelLabelWidth, minWidth: channelLabelWidth }}>
          <Skeleton
            variant="text"
            width={channelLabelWidth * 0.5}
            height={timeHeaderHeight * 0.4}
            sx={{ mx: 'auto', my: `${timeHeaderHeight * 0.3}px` }}
          />
        </Box>
        <Box display="flex" flex="1">
          {hours.map((h) => (
            <Box key={h} sx={{ width: pixelsPerMinute * 60, textAlign: 'center' }}>
              <Skeleton
                variant="text"
                width={pixelsPerMinute * 60 * 0.3}
                height={timeHeaderHeight * 0.4}
                sx={{ mx: 'auto', my: `${timeHeaderHeight * 0.3}px` }}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* — Filas de canales — */}
      <Box sx={{
        position: 'relative',
        height: `${timeHeaderHeight + rowCount * rowHeight}px`,
        overflow: 'hidden',      // para que no “se salgan” de la caja
      }}>
        {Array.from({ length: rowCount }).map((_, r) => (
          <Box
            key={r}
            display="flex"
            alignItems="center"
            sx={{
              height: rowHeight,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            {/* Logo difuso + texto */}
            <Box
              sx={{
                width: channelLabelWidth,
                minWidth: channelLabelWidth,
                px: 2,
              }}
            >
              <Skeleton
                variant="rectangular"
                width={channelLabelWidth * 0.6}
                height={rowHeight * 0.6}
                sx={{
                  mx: 'auto',
                  borderRadius: theme.shape.borderRadius,
                }}
              />
            </Box>
            <Box flex="1" />
          </Box>
        ))}

        {/* — Bloques “programa” — */}
        {blocks.map((b, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              top: b.top,
              left: b.left,
              width: b.width,
              height: b.height,
              borderRadius: theme.shape.borderRadius,
              bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              pl: 2,
              zIndex: 1
            }}
          >
            <Skeleton
              variant="rounded"
              animation="wave"
              width={Math.min(b.dur * pixelsPerMinute * 0.5, 80)}
              height={12}
              sx={{
                bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.09)',
                borderRadius: '8px'
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};