'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import { AuthService } from '@/services/auth';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function UserMenu() {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = AuthService.getCorrectToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.ok) {
          setUser(await res.json());
        }
      } catch {
        setUser(null);
      }
    }
    if (AuthService.isAuthenticated()) {
      loadProfile();
    }
  }, []);

  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    AuthService.logout();
    router.refresh();
  };

  if (!user) return null;

  return (
    <>
      <Button
        onClick={handleOpen}
        color="inherit"
        startIcon={
          <Avatar sx={{ width: 32, height: 32 }}>
            {user.firstName.charAt(0)}
          </Avatar>
        }
        sx={{ textTransform: 'none', ml: 1 }}
      >
        Hola, {user.firstName}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
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