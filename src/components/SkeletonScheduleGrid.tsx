'use client';

import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { useLayoutValues } from '@/constants/layout';

export const SkeletonScheduleGrid: React.FC = () => {
  const {
    channelLabelWidth,
    pixelsPerMinute,
    timeHeaderHeight,
    rowHeight,
  } = useLayoutValues();

  const hours = 24;
  const rows = 6; // muestro 6 filas de skeleton como ejemplo
  const times = Array.from({ length: hours });
  const channels = Array.from({ length: rows });

  // Genero unos “bloques” random para simular programas
  const randomBlocks = channels.flatMap((_, rowIdx) => {
    const count = Math.random() > 0.5 ? 2 : 1;
    return Array.from({ length: count }).map(() => {
      const startHour = Math.floor(Math.random() * (hours - 2));
      const duration = 1 + Math.floor(Math.random() * 3);
      return {
        top: timeHeaderHeight + rowIdx * rowHeight + 8,
        left:
          channelLabelWidth +
          startHour * 60 * pixelsPerMinute +
          8,
        width: duration * 60 * pixelsPerMinute - 16,
        height: rowHeight - 16,
      };
    });
  });

  return (
    <Box
      sx={{
        position: 'relative',
        width:
          channelLabelWidth + hours * 60 * pixelsPerMinute,
        minHeight:
          timeHeaderHeight + rows * rowHeight,
        bgcolor: 'transparent',
      }}
    >
      {/* 1. Encabezado de horas */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `${channelLabelWidth}px repeat(${hours}, ${60 *
            pixelsPerMinute}px)`,
          height: timeHeaderHeight,
        }}
      >
        {/* Celda “Canal” */}
        <Skeleton
          variant="text"
          width={channelLabelWidth * 0.6}
          height={timeHeaderHeight * 0.6}
          sx={{ my: timeHeaderHeight * 0.2, mx: 1 }}
        />
        {times.map((_, i) => (
          <Box key={i} sx={{ px: 1, pt: 1 }}>
            <Skeleton
              variant="text"
              width={60 * pixelsPerMinute * 0.5}
              height={timeHeaderHeight * 0.4}
            />
          </Box>
        ))}
      </Box>

      {/* 2. Filas de canales */}
      <Box
        sx={{
          position: 'absolute',
          top: timeHeaderHeight,
          left: 0,
          right: 0,
          display: 'grid',
          gridTemplateColumns: `${channelLabelWidth}px repeat(${hours}, ${60 *
            pixelsPerMinute}px)`,
          gridAutoRows: `${rowHeight}px`,
        }}
      >
        {channels.map((_, rowIdx) => (
          <React.Fragment key={rowIdx}>
            {/* Nombre del canal */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                pl: 1,
                borderTop: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Skeleton
                variant="circular"
                width={rowHeight * 0.6}
                height={rowHeight * 0.6}
              />
              <Skeleton
                variant="text"
                width={channelLabelWidth * 0.4}
                height={rowHeight * 0.3}
                sx={{ ml: 1 }}
              />
            </Box>
            {/* Celdas horarias vacías */}
            {times.map((_, colIdx) => (
              <Box
                key={colIdx}
                sx={{
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  borderLeft: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </Box>

      {/* 3. Bloques aleatorios (skeleton de programas) */}
      {randomBlocks.map((blk, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          sx={{
            position: 'absolute',
            top: blk.top,
            left: blk.left,
            width: blk.width,
            height: blk.height,
            borderRadius: 1,
          }}
        />
      ))}
    </Box>
  );
};