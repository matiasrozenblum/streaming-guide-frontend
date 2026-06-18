'use client';

import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import type { ZapItem } from '@/types/zap';

const ROW_HEIGHT = 64;
const MAX_VISIBLE_ROWS = 2;
const CARD_MAX_HEIGHT = ROW_HEIGHT * MAX_VISIBLE_ROWS;
const CARD_BG = '#1E293B';

function getLogoBg(bg?: string | null, square?: boolean): React.CSSProperties {
  if (!bg) return { backgroundColor: square ? '#1e293b' : '#FFFFFF' };
  if (bg.startsWith('linear-gradient')) return { background: bg };
  if (bg.includes('gradient')) return { backgroundColor: square ? '#1e293b' : '#FFFFFF' };
  return { backgroundColor: bg };
}

interface ZapCardProps {
  items: ZapItem[];
  position: 'above' | 'below';
  isOpen: boolean;
  onZap: (item: ZapItem) => void;
}

export const ZapCard: React.FC<ZapCardProps> = ({ items, position, isOpen, onZap }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep upper card scrolled to bottom (closest channel to player visible)
  useEffect(() => {
    if (position === 'above' && isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, position, items]);

  const borderRadius =
    position === 'above'
      ? '12px 12px 0 0'
      : '0 0 12px 12px';

  return (
    <Box
      sx={{
        maxHeight: isOpen && items.length > 0 ? `${CARD_MAX_HEIGHT}px` : 0,
        overflow: 'hidden',
        transition: 'max-height 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isOpen && items.length > 0 ? 'auto' : 'none',
        bgcolor: CARD_BG,
        borderRadius,
      }}
    >
      <Box
        ref={scrollRef}
        sx={{
          maxHeight: `${CARD_MAX_HEIGHT}px`,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '2px',
          },
        }}
      >
        {items.map((item) => (
          <Box
            key={item.id}
            onClick={() => onZap(item)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              height: `${ROW_HEIGHT}px`,
              px: 1.5,
              gap: 1.5,
              cursor: 'pointer',
              bgcolor: item.isLive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              mx: '6px',
              my: '2px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.12)',
              },
              transition: 'background-color 150ms ease',
            }}
          >
            {/* Logo */}
            {(() => {
              const isSquare = item.logoShape === 'square';
              return (
                <Box
                  sx={{
                    width: isSquare ? 48 : 72,
                    height: isSquare ? 48 : 36,
                    borderRadius: isSquare ? '8px' : '6px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...getLogoBg(item.backgroundColor, isSquare),
                  }}
                >
                  {item.logoUrl && (
                    <Box
                      component="img"
                      src={item.logoUrl}
                      alt={item.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: isSquare ? 'cover' : 'contain',
                      }}
                    />
                  )}
                </Box>
              );
            })()}

            {/* Channel name + program */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  color: '#e2e8f0',
                  fontSize: '14px',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.name}
              </Typography>
              {item.programName && (
                <Typography
                  sx={{
                    color: '#64748b',
                    fontSize: '11px',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.programName}
                </Typography>
              )}
            </Box>

            {/* Live badge */}
            {item.isLive && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: '#F44336',
                  }}
                />
                <Typography
                  sx={{
                    color: '#F44336',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                  }}
                >
                  EN VIVO
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
