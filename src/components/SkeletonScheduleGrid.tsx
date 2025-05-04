'use client';

import React from 'react';
import { Box } from '@mui/material';
import { useLayoutValues } from '@/constants/layout';

export const SkeletonScheduleGrid: React.FC = () => {
  const {
    channelLabelWidth,
    pixelsPerMinute,
    timeHeaderHeight,
    rowHeight,
  } = useLayoutValues();

  const hours = 24;
  const rows = 6; // cantidad de filas fantasma
  const times = Array.from({ length: hours });
  const channels = Array.from({ length: rows });

  // Genera unos bloques "random" por fila
  const randomBlocks = channels.flatMap((_, rowIdx) => {
    const blockCount = Math.random() > 0.5 ? 2 : 1;
    return Array.from({ length: blockCount }).map(() => {
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
      }}
    >
      {/* Header de horas */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `${channelLabelWidth}px repeat(${hours}, ${60 *
            pixelsPerMinute}px)`,
          height: timeHeaderHeight,
        }}
      >
        <Box />
        {times.map((_, i) => (
          <Box
            key={i}
            sx={{
              borderRight: '1px solid rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </Box>

      {/* Filas fantasma */}
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
        {channels.map((_, r) => (
          <React.Fragment key={r}>
            {/* etiqueta de canal */}
            <Box
              sx={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            {times.map((_, c) => (
              <Box
                key={`${r}-${c}`}
                sx={{
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  borderLeft: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </Box>

      {/* Bloques aleatorios */}
      {randomBlocks.map((blk, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            top: blk.top,
            left: blk.left,
            width: blk.width,
            height: blk.height,
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: 1,
          }}
        />
      ))}
    </Box>
  );
};
