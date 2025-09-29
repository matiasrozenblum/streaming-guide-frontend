'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Typography,
  useTheme,
  useMediaQuery,
  ListItemIcon,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';

const MIN_WIDTH = 155; // Minimum width based on natural "¡Hola, Matias!" size

interface UserMenuProps {
  onLogout: () => Promise<void>;
  showHomeOption?: boolean;
}

export default function UserMenu({ onLogout, showHomeOption = false }: UserMenuProps) {
  const router = useRouter();
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuWidth, setMenuWidth] = useState<string | number>(MIN_WIDTH);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    if (buttonRef.current && menuOpen) {
      // Use the larger of minimum width or actual button width
      const actualWidth = buttonRef.current.offsetWidth;
      setMenuWidth(Math.max(MIN_WIDTH, actualWidth));
    }
  }, [menuOpen]);

  // Only mostramos si hay sesión autenticada
  if (!typedSession?.user) {
    return null;
  }

  const user = typedSession.user;
  const firstName = user.name?.split(' ')[0] ?? 'Usuario';
  const isAdmin = user.role === 'admin';

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    await onLogout();
  };

  return (
    <>
      <Button
        ref={buttonRef}
        onClick={handleOpen}
        aria-controls={menuOpen ? 'user-menu-popover' : undefined}
        aria-haspopup="true"
        aria-expanded={menuOpen ? 'true' : undefined}
        color="inherit"
        sx={{
          textTransform: 'none',
          display: 'flex',
          alignItems: 'center',
          padding: 0, // No internal padding
          borderRadius: isMobile ? '50%' : '24px', // Circle on mobile, pill on desktop
          minWidth: isMobile ? 0 : `${MIN_WIDTH}px`,
          width: isMobile ? 40 : 'auto', // Fixed width on mobile for circle
          height: 40, // Fixed height for both
          marginRight: 1.5, // 12px spacing to the right
          backdropFilter: 'blur(8px)',
          color: 'text.primary',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light'
              ? 'rgba(255,255,255,0.95)'
              : 'rgba(50,61,79,0.95)',
          },
          transition: 'background-color 0.3s ease, border 0.3s ease',
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: '#007bff',
            color: 'white',
            fontSize: '0.9rem',
          }}
        >
          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
        </Avatar>
        {!isMobile && (
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.primary',
              ml: 0.75,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            ¡Hola, {firstName}!
          </Typography>
        )}
      </Button>
      <Menu
        id="user-menu-popover"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'user-button-loggedIn', // More descriptive
        }}
        PaperProps={{
          elevation: 0,
          sx: {
            width: menuWidth, // Apply the dynamically calculated width
            overflow: 'visible',
            mt: 1,
            borderRadius: '8px',
            border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'}`,
            backgroundColor: theme.palette.mode === 'light' ? 'rgba(248,249,250,0.9)' : 'rgba(30,41,59,0.95)', // Adjusted for distinct menu appearance
            backdropFilter: 'blur(8px)',
            '& .MuiMenuItem-root': {
              fontSize: '1rem',
              padding: '10px 16px',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
              },
            },
            '& .MuiListItemIcon-root': { // Style for icons in menu items
              minWidth: 'auto', // Allow icon to size naturally
              marginRight: theme.spacing(1), // Reduced spacing from 1.5 to 1
              color: 'text.secondary',
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            handleClose();
            router.push('/profile');
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Mi perfil
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            router.push('/subscriptions');
          }}
        >
          <ListItemIcon>
            <SubscriptionsIcon fontSize="small" />
          </ListItemIcon>
          Favoritos
        </MenuItem>
        <Divider sx={{ my: 0.5, borderColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)' }} />
        {showHomeOption ? (
          <MenuItem
            onClick={() => {
              handleClose();
              router.push('/');
            }}
          >
            <ListItemIcon>
              <HomeIcon fontSize="small" />
            </ListItemIcon>
            Inicio
          </MenuItem>
        ) : (
          isAdmin && (
            <MenuItem
              onClick={() => {
                handleClose();
                router.push('/backoffice');
              }}
            >
              <ListItemIcon>
                <AdminPanelSettingsIcon fontSize="small" />
              </ListItemIcon>
              Backoffice
            </MenuItem>
          )
        )}
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          Salir
        </MenuItem>
      </Menu>
    </>
  );
}
