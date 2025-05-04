'use client';

import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { useLayoutValues } from '@/constants/layout';

interface Props {
  rowCount: number;
}

export const SkeletonScheduleGrid: React.FC<Props> = ({ rowCount }) => {
  const {
    channelLabelWidth,
    timeHeaderHeight,
    rowHeight,
    pixelsPerMinute,
  } = useLayoutValues();

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generamos un bloque “programa” por fila (30' de ancho)  
  const blocks = Array.from({ length: rowCount }).map((_, r) => {
    const startMin = (r * 60) % (24 * 60);
    const durMin = 30;
    return {
      top: timeHeaderHeight + r * rowHeight + (rowHeight - 30) / 2,
      left: channelLabelWidth + startMin * pixelsPerMinute + 2,
      width: durMin * pixelsPerMinute - 4,
      height: 30,
    };
  });

  return (
    <Box>
      {/* 1) Tabs de días */}
      <Box display="flex" gap={1} p={2} alignItems="center">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width={80} height={40} />
        ))}
        <Box flex="1" />
        <Skeleton variant="rectangular" width={100} height={40} />
      </Box>

      {/* 2) Fila de horas */}
      <Box display="flex" sx={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <Box sx={{ width: channelLabelWidth, minWidth: channelLabelWidth }}>
          <Skeleton
            variant="text"
            width={channelLabelWidth * 0.5}
            height={timeHeaderHeight * 0.4}
            sx={{
              mx: 'auto',
              my: `${timeHeaderHeight * 0.3}px`,
            }}
          />
        </Box>
        <Box display="flex" flex="1">
          {hours.map((h) => (
            <Box key={h} sx={{ width: pixelsPerMinute * 60, textAlign: 'center' }}>
              <Skeleton
                variant="text"
                width={pixelsPerMinute * 60 * 0.3}
                height={timeHeaderHeight * 0.4}
                sx={{
                  mx: 'auto',
                  my: `${timeHeaderHeight * 0.3}px`,
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* 3) Filas de canales */}
      <Box sx={{ position: 'relative' }}>
        {Array.from({ length: rowCount }).map((_, r) => (
          <Box
            key={r}
            display="flex"
            alignItems="center"
            sx={{
              height: rowHeight,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Primer columna: logo+nombre */}
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
                sx={{ mx: 'auto' }}
              />
            </Box>
            <Box flex="1" />
          </Box>
        ))}

        {/* 4) Bloques de “programas” en cada fila */}
        {blocks.map((b, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            sx={{
              position: 'absolute',
              top: b.top,
              left: b.left,
              width: b.width,
              height: b.height,
              borderRadius: 1,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};