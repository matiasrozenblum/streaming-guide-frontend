'use client';

import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import type { ZapItem } from '@/types/zap';

const PANEL_WIDTH = 200;
const ROW_HEIGHT = 60;
const PANEL_BG = '#1E293B';

function getLogoBg(bg?: string | null): React.CSSProperties {
  if (!bg) return { backgroundColor: '#FFFFFF' };
  if (bg.startsWith('linear-gradient')) return { background: bg };
  if (bg.includes('gradient')) return { backgroundColor: '#FFFFFF' };
  return { backgroundColor: bg };
}

interface ZapSidePanelProps {
  aboveItems: ZapItem[];
  belowItems: ZapItem[];
  isOpen: boolean;
  playerHeight: number;
  onZap: (item: ZapItem) => void;
}

export const ZapSidePanel: React.FC<ZapSidePanelProps> = ({
  aboveItems,
  belowItems,
  isOpen,
  playerHeight,
  onZap,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  // When opened, scroll so that the divider (current position in list) is visible
  useEffect(() => {
    if (isOpen && scrollRef.current && dividerRef.current) {
      const containerTop = scrollRef.current.getBoundingClientRect().top;
      const dividerTop = dividerRef.current.getBoundingClientRect().top;
      const offset = dividerTop - containerTop - playerHeight / 2 + ROW_HEIGHT;
      scrollRef.current.scrollTop += offset;
    }
  }, [isOpen, playerHeight]);

  const hasAbove = aboveItems.length > 0;
  const hasBelow = belowItems.length > 0;

  return (
    <Box
      sx={{
        maxWidth: isOpen ? `${PANEL_WIDTH}px` : 0,
        overflow: 'hidden',
        transition: 'max-width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isOpen ? 'auto' : 'none',
        flexShrink: 0,
        alignSelf: 'stretch',
      }}
    >
      <Box
        ref={scrollRef}
        sx={{
          width: `${PANEL_WIDTH}px`,
          height: '100%',
          bgcolor: PANEL_BG,
          borderRadius: '12px 0 0 12px',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          '&::-webkit-scrollbar': { width: '3px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '2px',
          },
        }}
      >
        {/* Above channels */}
        {hasAbove && (
          <Box sx={{ pt: 0.5 }}>
            {aboveItems.map((item) => (
              <ChannelRow key={item.id} item={item} onZap={onZap} />
            ))}
          </Box>
        )}

        {/* Divider indicating current channel position */}
        <Box
          ref={dividerRef}
          sx={{
            mx: 1,
            my: 0.5,
            borderTop: '1px solid rgba(255,255,255,0.15)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              position: 'absolute',
              bgcolor: PANEL_BG,
              px: 0.75,
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Viendo ahora
          </Typography>
        </Box>

        {/* Below channels */}
        {hasBelow && (
          <Box sx={{ pb: 0.5 }}>
            {belowItems.map((item) => (
              <ChannelRow key={item.id} item={item} onZap={onZap} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

function ChannelRow({ item, onZap }: { item: ZapItem; onZap: (item: ZapItem) => void }) {
  return (
    <Box
      onClick={() => onZap(item)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: `${ROW_HEIGHT}px`,
        px: 1,
        gap: 1,
        cursor: 'pointer',
        bgcolor: item.isLive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
        mx: '4px',
        my: '2px',
        borderRadius: '8px',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.13)' },
        transition: 'background-color 150ms ease',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          width: 52,
          height: 26,
          borderRadius: '5px',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...getLogoBg(item.backgroundColor),
        }}
      >
        {item.logoUrl && (
          <Box
            component="img"
            src={item.logoUrl}
            alt={item.name}
            sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
      </Box>

      {/* Text */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {item.isLive && (
            <Box
              sx={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                bgcolor: '#F44336',
                flexShrink: 0,
              }}
            />
          )}
          <Typography
            sx={{
              color: '#e2e8f0',
              fontSize: '12px',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.name}
          </Typography>
        </Box>
        {item.programName && (
          <Typography
            sx={{
              color: '#64748b',
              fontSize: '10px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}
          >
            {item.programName}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
