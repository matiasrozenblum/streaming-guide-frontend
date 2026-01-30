'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, IconButton, useTheme, useMediaQuery, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useSessionContext } from '@/contexts/SessionContext';
import { event as gaEvent } from '@/lib/gtag';
import type { Banner } from '@/types/banner';
import { LinkType } from '@/types/banner';
import type { SessionWithToken } from '@/types/session';

interface BannerCarouselProps {
  banners: Banner[];
  autoRotate?: boolean;
  autoRotateInterval?: number;
}

const MotionBox = motion(Box);

/**
 * Banner Carousel Component
 * 
 * BANNER IMAGE SPECIFICATIONS:
 * 
 * Recommended banner image dimensions:
 * - Desktop: 1920×400 (wide banner)
 * - Mobile: 1200×400 (3:1), tighter composition
 * 
 * SAFE AREA CALCULATIONS:
 * 
 * The banner uses `object-fit: cover`, which means the image will scale to cover
 * the entire container, potentially cropping edges when the container aspect ratio
 * differs from the image's 2:1 ratio.
 * 
 * Container dimensions:
 * - Desktop: Fixed height 200px, variable width (typically 800px - 1920px)
 * - Mobile: Fixed height 120px, variable width (typically 320px - 600px)
 * 
 * When container is wider than 2:1 ratio (e.g., 1200px × 200px):
 * - Image scales to fit height (200px) = 400px wide (maintaining 2:1 ratio)
 * - Excess width is cropped: (1200 - 400) / 2 = 400px cropped from each side
 * - Maximum crop: ~21% from each side on very wide screens
 * 
 * When container is narrower than 2:1 ratio (e.g., 600px × 200px):
 * - Image scales to fit width (600px) = 300px tall (maintaining 2:1 ratio)
 * - Excess height is cropped: (300 - 200) / 2 = 50px cropped from top/bottom
 * - Maximum crop: ~12.5% from top/bottom on narrow screens
 * 
 * SAFE AREA RECOMMENDATIONS for 1920×400px banners:
 * 
 * Horizontal (left/right) safe area:
 * - Keep critical content at least 400px (21%) from each side
 * - Safe content width: 1120px centered (58% of total width)
 * 
 * Vertical (top/bottom) safe area:
 * - Keep critical content at least 50px (12.5%) from top/bottom
 * - Safe content height: 300px centered (75% of total height)
 * 
 * RECOMMENDED SAFE AREA:
 * - Left margin: 400px (21%)
 * - Right margin: 400px (21%)
 * - Top margin: 50px (12.5%)
 * - Bottom margin: 50px (12.5%)
 * - Safe content zone: 1120px × 300px centered in the 1920×400px image
 */
export default function BannerCarousel({
  banners,
  autoRotate = true,
  autoRotateInterval = 5000
}: BannerCarouselProps) {
  const { mode } = useThemeContext();
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Touch/swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Auto-rotation logic
  useEffect(() => {
    if (!autoRotate || banners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, autoRotateInterval, banners.length, isPaused]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  }, [banners.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  }, [banners.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Touch/swipe handlers for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  const handleBannerClick = useCallback((banner: Banner) => {
    // Track banner click
    gaEvent({
      action: 'banner_click',
      params: {
        banner_id: banner.id,
        banner_title: banner.title,
        banner_type: banner.banner_type,
        link_type: banner.link_type,
      },
      userData: typedSession?.user
    });

    // Handle navigation based on link type
    if (banner.link_type === LinkType.INTERNAL && banner.link_url) {
      router.push(banner.link_url);
    } else if (banner.link_type === LinkType.EXTERNAL && banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
    // LinkType.NONE does nothing
  }, [router, typedSession]);

  // Don't render if no banners
  if (!banners || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];
  const imageSrc = isMobile
    ? (currentBanner.image_url_mobile || currentBanner.image_url)
    : (currentBanner.image_url_desktop || currentBanner.image_url);
  const hasMultipleBanners = banners.length > 1;

  // Responsive dimensions
  const bannerHeight = isMobile ? '120px' : '200px';
  const borderRadius = isMobile ? '12px' : '16px';

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: bannerHeight,
        borderRadius,
        overflow: 'hidden',
        cursor: currentBanner.link_type !== LinkType.NONE ? 'pointer' : 'default',
        boxShadow: mode === 'light'
          ? '0 4px 12px rgba(0, 0, 0, 0.1)'
          : '0 4px 12px rgba(0, 0, 0, 0.3)',
        '&:hover': {
          boxShadow: mode === 'light'
            ? '0 6px 20px rgba(0, 0, 0, 0.15)'
            : '0 6px 20px rgba(0, 0, 0, 0.4)',
        },
      }}
      onMouseEnter={() => {
        setIsPaused(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsPaused(false);
        setIsHovered(false);
      }}
      onClick={() => handleBannerClick(currentBanner)}
      onTouchStart={isMobile ? onTouchStart : undefined}
      onTouchMove={isMobile ? onTouchMove : undefined}
      onTouchEnd={isMobile ? onTouchEnd : undefined}
    >
      <AnimatePresence mode="wait">
        <MotionBox
          key={currentBanner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Background Image */}
          <Image
            src={imageSrc}
            alt={currentBanner.title}
            fill
            style={{
              objectFit: 'cover', // Cover the entire container, may crop edges
              objectPosition: 'center', // Center the image within the container
            }}
            sizes={isMobile ? '100vw' : '100vw'}
            priority={true} // Always prioritize banner images for fast loading
            quality={85} // Optimize quality vs size
          />

          {/* Content Overlay - Only show when description is set (text baked into image otherwise) */}
          {currentBanner.description && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                p: isMobile ? 2 : 3,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              }}
            >
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                component="h3"
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  mb: 0.5,
                  lineHeight: 1.2,
                }}
              >
                {currentBanner.title}
              </Typography>

              <Typography
                variant={isMobile ? 'body2' : 'body1'}
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  display: '-webkit-box',
                  WebkitLineClamp: isMobile ? 2 : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {currentBanner.description}
              </Typography>
            </Box>
          )}
        </MotionBox>
      </AnimatePresence>

      {/* Navigation Controls - Only show on desktop and when hovered, hide on mobile */}
      {hasMultipleBanners && !isMobile && (
        <>
          {/* Previous/Next Buttons */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'transparent',
              color: 'white',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
              width: 40,
              height: 40,
            }}
          >
            <ChevronLeft fontSize="medium" />
          </IconButton>

          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'transparent',
              color: 'white',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
              width: 40,
              height: 40,
            }}
          >
            <ChevronRight fontSize="medium" />
          </IconButton>

          {/* Dots Indicator */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 12,
              display: 'flex',
              gap: 0.5,
            }}
          >
            {banners.map((_, index) => (
              <Box
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
                sx={{
                  width: isMobile ? 6 : 8,
                  height: isMobile ? 6 : 8,
                  borderRadius: '50%',
                  backgroundColor: index === currentIndex
                    ? 'rgba(255,255,255,0.9)'
                    : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.7)',
                  },
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
