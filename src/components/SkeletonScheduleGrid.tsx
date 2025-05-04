'use client';

import React from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';
import { useLayoutValues } from '@/constants/layout';

interface Props {
  rowCount: number;
}

export const SkeletonScheduleGrid: React.FC<Props> = ({ rowCount }) => {
  const theme = useTheme();
  const {
    channelLabelWidth,
    timeHeaderHeight,
    rowHeight,
    pixelsPerMinute,
  } = useLayoutValues();

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generar 2 bloques aleatorios por fila
  const blocks = Array.from({ length: rowCount }).flatMap((_, r) => {
    return [0, 1].map(() => {
      // offset aleatorio entre 0 y 20 horas
      const startHour = Math.floor(Math.random() * 20);
      const startMin = startHour * 60 + Math.floor(Math.random() * 60);
      // duración entre 30 y 90 minutos
      const durMin = 30 + Math.floor(Math.random() * 60);
      return {
        top: timeHeaderHeight + r * rowHeight + (rowHeight - rowHeight * 0.6) / 2,
        left: channelLabelWidth + startMin * pixelsPerMinute + 2,
        width: durMin * pixelsPerMinute - 4,
        height: rowHeight * 0.6,
      };
    });
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
          <Skeleton
            key={i}
            variant="rectangular"
            animation="wave"
            sx={{
              position: 'absolute',
              top: b.top,
              left: b.left,
              width: b.width,
              height: b.height,
              borderRadius: theme.shape.borderRadius,
              zIndex: 1
            }}
          />
        ))}
      </Box>
    </Box>
  );
};