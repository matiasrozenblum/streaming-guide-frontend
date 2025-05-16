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
} from '@mui/material';

export default function UserMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Solo mostramos si hay sesión autenticada
  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const firstName = user.name?.split(' ')[0] ?? 'Usuario';

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.refresh();
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        color="inherit"
        startIcon={
          <Avatar sx={{ width: 32, height: 32 }}>
            {firstName.charAt(0)}
          </Avatar>
        }
        sx={{ textTransform: 'none', ml: 1 }}
      >
        Hola, {firstName}
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
        <MenuItem onClick={handleLogout}>Salir</MenuItem>
      </Menu>
    </>
  );
}
