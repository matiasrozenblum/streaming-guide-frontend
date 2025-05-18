'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Button,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';

export default function UserMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Solo mostramos si hay sesión autenticada
  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const firstName = user.name?.split(' ')[0] ?? 'Usuario';
  const isAdmin = session.user.role === 'admin';

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
            {firstName.charAt(0).toUpperCase()}
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
            Hola, {firstName}
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
          Mi cuenta
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
