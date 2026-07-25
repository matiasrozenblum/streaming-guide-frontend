'use client';

import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ZappingTooltipProps {
  text: string;
  onDismiss: () => void;
  /** 'up' = arrow at top pointing up, 'right' = arrow on right pointing right, 'none' = no arrow */
  arrowDirection?: 'up' | 'right' | 'none';
}

const ARROW_COLOR = '#334155';

export const ZappingTooltip: React.FC<ZappingTooltipProps> = ({
  text,
  onDismiss,
  arrowDirection = 'up',
}) => (
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
          left: 9,
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderBottom: `11px solid ${ARROW_COLOR}`,
        },
      }),
      ...(arrowDirection === 'right' && {
        '&::before': {
          content: '""',
          position: 'absolute',
          right: -11,
          top: 14,
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
