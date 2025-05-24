'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
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
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';

export default function UserMenu() {
  const router = useRouter();
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Solo mostramos si hay sesión autenticada
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
    await signOut({ callbackUrl: '/login' });
    router.refresh();
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        color="inherit"
        startIcon={
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText
            }}
          >
            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
          </Avatar>
        }
        sx={{ 
          textTransform: 'none', 
          ml: 1,
          minWidth: isMobile ? 'auto' : undefined,
          px: isMobile ? 1 : 2
        }}
      >
        {!isMobile && (
          <Typography
            variant="button"
            sx={{ color: 'text.secondary', ml: 0.5 }}
          >
            ¡Hola, {firstName}!
          </Typography>
        )}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ sx: { mt: 1 } }}
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
          Mi Perfil ({user.name || user.email})
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            router.push('/subscriptions');
          }}
        >
          Suscripciones
        </MenuItem>
        <Divider />
        {isAdmin && (
          <MenuItem
            onClick={() => {
              handleClose();
              router.push('/backoffice');
            }}
          >
            Backoffice
          </MenuItem>
        )}

        <MenuItem onClick={handleLogout}>
          Salir
        </MenuItem>
      </Menu>
    </>
  );
}
