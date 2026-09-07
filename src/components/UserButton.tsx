"use client";
import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LoginModal from './auth/LoginModal';

export const UserButton = () => {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      <Tooltip title="Acceder a tu cuenta" arrow>
        <IconButton
          onClick={() => setLoginOpen(true)}
          aria-label="Acceder a tu cuenta"
          size="large"
          sx={{
            width: 44,
            height: 44,
            color: 'text.secondary',
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)',
              transform: 'scale(1.05)',
            },
            '&:focus-visible': {
              outline: '2px solid #90caf9',
              outlineOffset: '2px',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <PersonIcon />
        </IconButton>
      </Tooltip>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
};