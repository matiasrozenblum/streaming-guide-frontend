// src/components/NowIndicator.tsx
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

export const NowIndicator = () => {
  const [position, setPosition] = useState(0);

  const updatePosition = () => {
    const now = dayjs();
    const start = now.hour(8).minute(0).second(0); // día de referencia desde las 08:00
    const minutesFromStart = now.diff(start, 'minute');
    const pos = (minutesFromStart / 60) * 100; // 100px por hora
    setPosition(pos);
  };

  useEffect(() => {
    updatePosition();
    const interval = setInterval(updatePosition, 60000); // actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  // Si aún no es hora de empezar la grilla
  if (position < 0 || position > 1200) return null;

  return (
    <Box
      position="absolute"
      top={0}
      left={`${position}px`}
      height="100%"
      width="2px"
      bgcolor="red"
      zIndex={2}
    />
  );
};