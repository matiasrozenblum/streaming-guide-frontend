import React from 'react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Box, Container, useTheme, useMediaQuery, Typography } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import UserMenu from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import { tokens } from '@/design-system/tokens';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import { UserButton } from './UserButton';
import { event as gaEvent } from '@/lib/gtag';
import { signOut } from 'next-auth/react';

export default function Header() {
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const { mode } = useThemeContext();
  const router = useRouter();
  const pathname = usePathname();
  const isAuth = typedSession?.user.role === 'user' || typedSession?.user.role === 'admin';
  const logo = '/img/logo.png';
  const text = mode === 'light' ? '/img/text.png' : '/img/text-white.png';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isHomePage, setIsHomePage] = React.useState(false);
  
  const isCanalesPage = pathname === '/';
  const isStreamersPage = pathname === '/streamers';

  // Responsive logo/text height usando tokens
  const logoHeight = isMobile ? '8.25vh' : '11vh';
  const headerHeight = isMobile ? '9.75vh' : '13vh';

  React.useEffect(() => {
    setIsHomePage(window.location.pathname === '/');
  }, []);

  const handleLogout = async () => {
    gaEvent({
      action: 'logout_attempt',
      params: {},
      userData: typedSession?.user
    });
    await signOut({ redirect: false });
    gaEvent({
      action: 'logout_success',
      params: {},
      userData: typedSession?.user
    });
    router.push('/');
  };

  const handleLogoClick = () => {
    // Only navigate if not already on home page
    if (!isHomePage) {
      router.push('/');
    }
  };

  return (
    <Container maxWidth="xl" disableGutters sx={{ px: 0, mb: { xs: tokens.spacing.sm, sm: tokens.spacing.md } }}>
      <Box
        sx={{
          height: headerHeight,
          display: 'flex',
          alignItems: 'center',
          borderRadius: tokens.borderRadius.lg,
          px: { xs: tokens.spacing.sm, sm: tokens.spacing.md },
          position: 'relative',
        }}
      >
        {/* Clickable logo container */}
        <Box
          onClick={handleLogoClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
              transition: 'opacity 0.2s ease-in-out'
            }
          }}
        >
          <Box component="img" src={logo} alt="Logo" sx={{ height: logoHeight, width: 'auto' }} />
          <Box
            component="img"
            src={text}
            alt="Texto"
            sx={{ 
              pl: { xs: tokens.spacing.sm, sm: tokens.spacing.md }, 
              height: logoHeight, 
              width: 'auto' 
            }}
          />
        </Box>
        
        {/* Desktop Navigation Tabs - positioned after logo */}
        {!isMobile && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              ml: 4,
            }}
          >
            <Typography
              onClick={() => {
                router.push('/');
                gaEvent({
                  action: 'navigation_click',
                  params: { section: 'canales', location: 'header' },
                  userData: typedSession?.user
                });
              }}
              sx={{
                cursor: 'pointer',
                fontSize: '1.125rem',
                fontWeight: isCanalesPage ? 600 : 400,
                color: isCanalesPage
                  ? (mode === 'light' ? '#1976d2' : '#ffffff')
                  : (mode === 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'),
                transition: 'color 0.2s ease-in-out',
                '&:hover': {
                  color: isCanalesPage
                    ? (mode === 'light' ? '#1976d2' : '#ffffff')
                    : (mode === 'light' ? '#1976d2' : 'rgba(255,255,255,0.9)'),
                },
                position: 'relative',
                '&::after': isCanalesPage ? {
                  content: '""',
                  position: 'absolute',
                  bottom: '-8px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: mode === 'light' ? '#1976d2' : '#42a5f5',
                } : {},
              }}
            >
              Canales
            </Typography>
            <Typography
              onClick={() => {
                router.push('/streamers');
                gaEvent({
                  action: 'navigation_click',
                  params: { section: 'streamers', location: 'header' },
                  userData: typedSession?.user
                });
              }}
              sx={{
                cursor: 'pointer',
                fontSize: '1.125rem',
                fontWeight: isStreamersPage ? 600 : 400,
                color: isStreamersPage
                  ? (mode === 'light' ? '#1976d2' : '#ffffff')
                  : (mode === 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'),
                transition: 'color 0.2s ease-in-out',
                '&:hover': {
                  color: isStreamersPage
                    ? (mode === 'light' ? '#1976d2' : '#ffffff')
                    : (mode === 'light' ? '#1976d2' : 'rgba(255,255,255,0.9)'),
                },
                position: 'relative',
                '&::after': isStreamersPage ? {
                  content: '""',
                  position: 'absolute',
                  bottom: '-8px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: mode === 'light' ? '#1976d2' : '#42a5f5',
                } : {},
              }}
            >
              Streamers
            </Typography>
          </Box>
        )}

        {/* Right side controls */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            right: 0,
            pr: { xs: tokens.spacing.sm, sm: tokens.spacing.md }, 
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {!isAuth ? (
            <>
            <UserButton />
            </>
          ) : (
            <UserMenu onLogout={handleLogout} />
          )}
          <ThemeToggle />
        </Box>
      </Box>
    </Container>
  );
} 