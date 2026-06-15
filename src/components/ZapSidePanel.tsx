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
  items: ZapItem[];            // All channels in grid order (videoUrl !== null + current)
  currentId: number | undefined;
  isOpen: boolean;
  playerHeight: number;
  onZap: (item: ZapItem) => void;
}

export const ZapSidePanel: React.FC<ZapSidePanelProps> = ({
  items,
  currentId,
  isOpen,
  onZap,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRowRef = useRef<HTMLDivElement>(null);

  // When opened, scroll so the current channel is centered in the panel
  useEffect(() => {
    if (isOpen && currentRowRef.current) {
      currentRowRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [isOpen]);

  return (
    <Box
      sx={{ width: '100%', height: '100%' }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
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
          overscrollBehavior: 'contain',
          display: 'flex',
          flexDirection: 'column',
          pt: 0.5,
          pb: 0.5,
          '&::-webkit-scrollbar': { width: '3px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '2px',
          },
        }}
      >
        {items.map((item) => {
          const isCurrent = item.id === currentId;
          return (
            <ChannelRow
              key={item.id}
              item={item}
              isCurrent={isCurrent}
              currentRef={isCurrent ? currentRowRef : undefined}
              onZap={onZap}
            />
          );
        })}
      </Box>
    </Box>
  );
};

function ChannelRow({
  item,
  isCurrent,
  currentRef,
  onZap,
}: {
  item: ZapItem;
  isCurrent: boolean;
  currentRef?: React.RefObject<HTMLDivElement | null>;
  onZap: (item: ZapItem) => void;
}) {
  return (
    <Box
      ref={currentRef}
      onClick={() => !isCurrent && onZap(item)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: `${ROW_HEIGHT}px`,
        px: 1,
        gap: 1,
        cursor: isCurrent ? 'default' : 'pointer',
        bgcolor: isCurrent
          ? 'rgba(59,130,246,0.18)'
          : item.isLive
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(255,255,255,0.04)',
        mx: '4px',
        my: '2px',
        borderRadius: '8px',
        border: isCurrent ? '1px solid rgba(59,130,246,0.45)' : '1px solid transparent',
        '&:hover': {
          bgcolor: isCurrent ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.13)',
        },
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
          {/* Current = blue dot, live = red dot */}
          {(isCurrent || item.isLive) && (
            <Box
              sx={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                bgcolor: isCurrent ? '#3b82f6' : '#F44336',
                flexShrink: 0,
              }}
            />
          )}
          <Typography
            sx={{
              color: isCurrent ? '#93c5fd' : '#e2e8f0',
              fontSize: '12px',
              fontWeight: isCurrent ? 700 : 600,
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
