import React from 'react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Box, Container, useTheme, useMediaQuery, Button } from '@mui/material';
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
  
  const isProgramacionPage = pathname === '/';
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
          {/* Desktop Navigation Buttons */}
          {!isMobile && (
            <>
              <Button
                onClick={() => {
                  router.push('/');
                  gaEvent({
                    action: 'navigation_click',
                    params: { section: 'programacion', location: 'header' },
                    userData: typedSession?.user
                  });
                }}
                variant={isProgramacionPage ? 'contained' : 'outlined'}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2,
                  fontWeight: isProgramacionPage ? 600 : 500,
                  backgroundColor: isProgramacionPage 
                    ? (mode === 'light' ? '#1976d2' : '#42a5f5')
                    : 'transparent',
                  borderColor: mode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                  color: isProgramacionPage 
                    ? 'white'
                    : (mode === 'light' ? '#1976d2' : '#90caf9'),
                  '&:hover': {
                    backgroundColor: isProgramacionPage
                      ? (mode === 'light' ? '#1565c0' : '#42a5f5')
                      : (mode === 'light' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(66, 165, 245, 0.16)'),
                    borderColor: mode === 'light' ? '#1976d2' : '#42a5f5',
                  },
                }}
              >
                Programación
              </Button>
              <Button
                onClick={() => {
                  router.push('/streamers');
                  gaEvent({
                    action: 'navigation_click',
                    params: { section: 'streamers', location: 'header' },
                    userData: typedSession?.user
                  });
                }}
                variant={isStreamersPage ? 'contained' : 'outlined'}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2,
                  fontWeight: isStreamersPage ? 600 : 500,
                  backgroundColor: isStreamersPage 
                    ? (mode === 'light' ? '#1976d2' : '#42a5f5')
                    : 'transparent',
                  borderColor: mode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                  color: isStreamersPage 
                    ? 'white'
                    : (mode === 'light' ? '#1976d2' : '#90caf9'),
                  '&:hover': {
                    backgroundColor: isStreamersPage
                      ? (mode === 'light' ? '#1565c0' : '#42a5f5')
                      : (mode === 'light' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(66, 165, 245, 0.16)'),
                    borderColor: mode === 'light' ? '#1976d2' : '#42a5f5',
                  },
                }}
              >
                Streamers
              </Button>
            </>
          )}
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