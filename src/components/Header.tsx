import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Box, Container, IconButton, Typography, useTheme, useMediaQuery } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import UserMenu from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import LoginModal from './auth/LoginModal';

export default function Header() {
  const { data: session } = useSession();
  const { mode } = useThemeContext();
  const [loginOpen, setLoginOpen] = useState(false);
  const isAuth = session?.user.role === 'user' || session?.user.role === 'admin';
  const logo = '/img/logo.png';
  const text = mode === 'light' ? '/img/text.png' : '/img/text-white.png';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Responsive logo/text height
  const logoHeight = isMobile ? '8.25vh' : '11vh'; // 75% of 11vh
  const headerHeight = isMobile ? '9.75vh' : '13vh'; // 75% of 13vh
  const px = isMobile ? 1 : 2;

  return (
    <Container maxWidth="xl" disableGutters sx={{ px: 0, mb: { xs: 1, sm: 2 } }}>
      <Box
        sx={{
          height: headerHeight,
          display: 'flex',
          alignItems: 'center',
          background:
            mode === 'light'
              ? 'linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.8) 100%)'
              : 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
          borderRadius: 2,
          boxShadow:
            mode === 'light'
              ? '0 4px 6px -1px rgb(0 0 0 / 0.1),0 2px 4px -2px rgb(0 0 0 / 0.1)'
              : '0 4px 6px -1px rgb(0 0 0 / 0.3),0 2px 4px -2px rgb(0 0 0 / 0.3)',
          backdropFilter: 'blur(8px)',
          px,
          position: 'relative',
        }}
      >
        <Box component="img" src={logo} alt="Logo" sx={{ height: logoHeight, width: 'auto' }} />
        <Box
          component="img"
          src={text}
          alt="Texto"
          sx={{ pl: { xs: 1, sm: 2 }, height: logoHeight, width: 'auto' }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            right: 8,
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
                sx={{ ml: 1 }}
              >
                <PersonIcon sx={{ color: 'text.secondary' }} />
                {!isMobile && (
                  <Typography variant="button" sx={{ color: 'text.secondary', ml: 0.5 }}>
                    Acceder
                  </Typography>
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