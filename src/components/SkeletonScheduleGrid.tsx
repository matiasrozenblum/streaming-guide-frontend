'use client';

import React from 'react';
import { Box, Skeleton, useTheme, useMediaQuery } from '@mui/material';
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

  const blocks = Array.from({ length: rowCount }).flatMap((_, r) => {
    const MAX_MIN = 11 * 60;          // límite de inicio: 11:00 en minutos
    const DURS = [60, 120];           // posibles duraciones: 60' o 120'
    const yTop =
      timeHeaderHeight +
      r * rowHeight +
      (rowHeight - rowHeight * 0.6) / 2;
    const h = rowHeight * 0.6;
  
    // 1️⃣ Primer bloque
    const dur1 = DURS[Math.floor(Math.random() * DURS.length)];
    const start1 = Math.floor(Math.random() * (MAX_MIN - dur1 + 1));
  
    // 2️⃣ Segundo bloque: reintentar hasta que no solape con el primero
    const dur2 = DURS[Math.floor(Math.random() * DURS.length)];
    let start2: number;
    do {
      start2 = Math.floor(Math.random() * (MAX_MIN - dur2 + 1));
    } while (
      // condición de solapamiento:
      !(start2 + dur2 <= start1 || start2 >= start1 + dur1)
    );
  
    // ahora construimos ambos rectángulos
    return [
      {
        top: yTop,
        left: channelLabelWidth + start1 * pixelsPerMinute + 2,
        width: dur1 * pixelsPerMinute - 4,
        height: h,
      },
      {
        top: yTop,
        left: channelLabelWidth + start2 * pixelsPerMinute + 2,
        width: dur2 * pixelsPerMinute - 4,
        height: h,
      },
    ];
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