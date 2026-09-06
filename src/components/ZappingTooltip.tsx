'use client';

import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ZappingTooltipProps {
  text: string;
  onDismiss: () => void;
  /** 'up' = arrow at top, 'down' = arrow at bottom, 'right' = arrow on right, 'none' = no arrow */
  arrowDirection?: 'up' | 'down' | 'right' | 'none';
  /** For up/down arrows: which horizontal edge the arrow is anchored to. Default 'right'. */
  arrowFrom?: 'left' | 'right';
  /** For up/down arrows: distance in px from the anchored edge. Default 24. */
  arrowOffset?: number;
}

const ARROW_COLOR = '#334155';

export const ZappingTooltip: React.FC<ZappingTooltipProps> = ({
  text,
  onDismiss,
  arrowDirection = 'up',
  arrowFrom = 'right',
  arrowOffset = 24,
}) => {
  const horizontalAnchor =
    arrowFrom === 'left' ? { left: arrowOffset } : { right: arrowOffset };

  return (
    <Box
      sx={{
        bgcolor: ARROW_COLOR,
        border: 'none',
        borderRadius: '10px',
        p: 1.5,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        position: 'relative',
        ...(arrowDirection === 'up' && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -11,
            ...horizontalAnchor,
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: `11px solid ${ARROW_COLOR}`,
          },
        }),
        ...(arrowDirection === 'down' && {
          '&::before': {
            content: '""',
            position: 'absolute',
            bottom: -11,
            ...horizontalAnchor,
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: `11px solid ${ARROW_COLOR}`,
          },
        }),
        ...(arrowDirection === 'right' && {
          '&::before': {
            content: '""',
            position: 'absolute',
            right: -11,
            top: 16,
            width: 0,
            height: 0,
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderLeft: `11px solid ${ARROW_COLOR}`,
          },
        }),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Typography sx={{ color: '#e2e8f0', fontSize: '13px', lineHeight: 1.5, flex: 1 }}>
        {text}
      </Typography>
      <IconButton
        size="small"
        onClick={onDismiss}
        sx={{
          color: '#fff',
          bgcolor: 'rgba(255,255,255,0.15)',
          p: 0.5,
          flexShrink: 0,
          width: 28,
          height: 28,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
        }}
      >
        <CloseIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );
};
