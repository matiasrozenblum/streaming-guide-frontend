import React, { useState } from 'react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Box, Container, IconButton, useTheme, useMediaQuery } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import UserMenu from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import LoginModal from './auth/LoginModal';
import { tokens } from '@/design-system/tokens';
import { Text } from '@/design-system/components';
import { useSessionContext } from '@/contexts/SessionContext';

export default function Header() {
  const { session } = useSessionContext();
  const { mode } = useThemeContext();
  const [loginOpen, setLoginOpen] = useState(false);
  const isAuth = session?.user.role === 'user' || session?.user.role === 'admin';
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
          background:
            mode === 'light'
              ? 'linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.8) 100%)'
              : 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
          borderRadius: tokens.borderRadius.lg,
          boxShadow: mode === 'light' ? tokens.boxShadow.md : tokens.boxShadow.lg,
          backdropFilter: 'blur(8px)',
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
            right: tokens.spacing.md,
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {!isAuth ? (
            <>
              <IconButton
                color="inherit"
                onClick={() => setLoginOpen(true)}
                sx={{ ml: tokens.spacing.sm }}
              >
                <PersonIcon sx={{ color: 'text.secondary' }} />
                {!isMobile && (
                  <Text 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary', 
                      ml: tokens.spacing.xs,
                      fontWeight: tokens.typography.fontWeight.medium
                    }}
                  >
                    ACCEDER
                  </Text>
                )}
              </IconButton>
              <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
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