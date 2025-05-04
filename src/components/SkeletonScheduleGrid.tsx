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

  // anchura total de la grilla
  const totalWidth = channelLabelWidth + pixelsPerMinute * 60 * 24;
  // altura total (header + filas)
  const totalHeight = timeHeaderHeight + rowCount * rowHeight;

  // Generar bloques “random” simulando programas
  const blocks = Array.from({ length: rowCount }).map((_, r) => {
    const startMin = Math.floor(Math.random() * (24 * 4)) * 15; // en múltiplos de 15'
    const durMin = (1 + Math.floor(Math.random() * 3)) * 15;    // 15', 30' o 45'
    return {
      top: timeHeaderHeight + r * rowHeight + 4,
      left: channelLabelWidth + startMin * pixelsPerMinute + 4,
      width: durMin * pixelsPerMinute - 8,
      height: rowHeight - 8,
    };
  });

  return (
    <Box
      sx={{
        position: 'relative',
        width: totalWidth,
        minHeight: totalHeight,
        bgcolor: 'transparent',
      }}
    >
      {/* 1) Encabezado horario */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `${channelLabelWidth}px repeat(24, ${60 *
            pixelsPerMinute}px)`,
          height: timeHeaderHeight,
        }}
      >
        {/* “Canal” */}
        <Skeleton
          variant="text"
          width={channelLabelWidth * 0.5}
          height={timeHeaderHeight * 0.4}
          sx={{ mx: 'auto', my: `${timeHeaderHeight * 0.3}px` }}
        />
        {hours.map((h) => (
          <Box key={h} sx={{ position: 'relative' }}>
            <Skeleton
              variant="text"
              width={pixelsPerMinute * 60 * 0.3}
              height={timeHeaderHeight * 0.3}
              sx={{
                position: 'absolute',
                top: timeHeaderHeight * 0.35,
                left: `calc(50% - ${pixelsPerMinute * 60 * 0.15}px)`,
              }}
            />
          </Box>
        ))}
      </Box>

      {/* 2) Filas de canales */}
      <Box
        sx={{
          position: 'absolute',
          top: timeHeaderHeight,
          left: 0,
          display: 'grid',
          gridTemplateColumns: `${channelLabelWidth}px repeat(24, ${60 *
            pixelsPerMinute}px)`,
          gridAutoRows: `${rowHeight}px`,
        }}
      >
        {Array.from({ length: rowCount }).map((_, r) => (
          <React.Fragment key={r}>
            {/* Logo + nombre */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                pl: 1,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
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

            {/* Celdas vacías */}
            {hours.map((h) => (
              <Box
                key={h}
                sx={{
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </Box>

      {/* 3) Bloques simulados */}
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
  );
};