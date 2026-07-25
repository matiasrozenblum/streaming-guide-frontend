'use client';

import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ZappingTooltipProps {
  text: string;
  onDismiss: () => void;
  showArrow?: boolean;
}

export const ZappingTooltip: React.FC<ZappingTooltipProps> = ({
  text,
  onDismiss,
  showArrow = true,
}) => (
  <Box
    sx={{
      bgcolor: 'rgba(15,23,42,0.97)',
      border: '1px solid rgba(59,130,246,0.5)',
      borderRadius: '10px',
      p: 1.5,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1,
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      position: 'relative',
      ...(showArrow && {
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -8,
          left: 12,
          width: 0,
          height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderBottom: '8px solid rgba(59,130,246,0.5)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -6,
          left: 13,
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '7px solid rgba(15,23,42,0.97)',
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
        color: 'rgba(255,255,255,0.5)',
        p: 0.25,
        flexShrink: 0,
        mt: -0.25,
        '&:hover': { color: '#fff' },
      }}
    >
      <CloseIcon sx={{ fontSize: 16 }} />
    </IconButton>
  </Box>
);
