import React from 'react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import UserMenu from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import { tokens } from '@/design-system/tokens';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import { UserButton } from './UserButton';

export default function Header() {
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const { mode } = useThemeContext();
  const isAuth = typedSession?.user.role === 'user' || typedSession?.user.role === 'admin';
  const logo = '/img/logo.png';
  const text = mode === 'light' ? '/img/text.png' : '/img/text-white.png';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Responsive logo/text height usando tokens
  const logoHeight = isMobile ? '8.25vh' : '11vh';
  const headerHeight = isMobile ? '9.75vh' : '13vh';

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
            <UserMenu />
          )}
          <ThemeToggle />
        </Box>
      </Box>
    </Container>
  );
} 