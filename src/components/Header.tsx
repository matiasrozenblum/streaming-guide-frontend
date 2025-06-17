import React from 'react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/navigation';
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
  const isAuth = typedSession?.user.role === 'user' || typedSession?.user.role === 'admin';
  const logo = '/img/logo.png';
  const text = mode === 'light' ? '/img/text.png' : '/img/text-white.png';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isHomePage, setIsHomePage] = React.useState(false);

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