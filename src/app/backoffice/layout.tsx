'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSessionContext } from '@/contexts/SessionContext';

import { signOut } from 'next-auth/react';
import {
  Box, Drawer, AppBar, Toolbar, Typography,
  List, ListItem, ListItemIcon, ListItemText,
  IconButton, ListItemButton
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, LiveTv,
  People, Schedule,
  TrackChanges,
  ToggleOn,
  Movie,
  Mic,
  CalendarMonth,
  BarChart,
  Category as CategoryIcon,
  Person as PersonIcon,
  ViewCarousel
} from '@mui/icons-material';
import type { SessionWithToken } from '@/types/session';
import UserMenu from '@/components/UserMenu';
import Image from 'next/image';

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, status } = useSessionContext();

  const typedSession = session as SessionWithToken | null;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // si no hay sesión o el role no es admin, redirige
    if (status === 'authenticated' && typedSession?.user.role !== 'admin') {
      router.push('/');
    }
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, typedSession, router, pathname]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const drawerWidth = 240;
  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/backoffice' },
    { text: 'Canales', icon: <LiveTv />, path: '/backoffice/channels' },
    { text: 'Streamers', icon: <PersonIcon />, path: '/backoffice/streamers' },
    { text: 'Banners', icon: <ViewCarousel />, path: '/backoffice/banners' },
    { text: 'Categorías', icon: <CategoryIcon />, path: '/backoffice/categories' },
    { text: 'Programas', icon: <Movie />, path: '/backoffice/programs' },
    { text: 'Panelistas', icon: <Mic />, path: '/backoffice/panelists' },
    { text: 'Horarios', icon: <Schedule />, path: '/backoffice/schedules' },
    { text: 'Cambios Semanales', icon: <CalendarMonth />, path: '/backoffice/weekly-overrides' },
    { text: 'Configs', icon: <ToggleOn />, path: '/backoffice/configs' },
    { text: 'Cambios', icon: <TrackChanges />, path: '/backoffice/changes' },
    { text: 'Usuarios', icon: <People />, path: '/backoffice/users' },
    { text: 'Estadísticas', icon: <BarChart />, path: '/backoffice/statistics' },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 }
          }}
          onClick={() => router.push('/')}
        >
          <Image
            src="/img/logo.png"
            alt="La Guía del Streaming"
            width={44}
            height={44}
            style={{ marginRight: '8px', objectFit: 'contain' }}
          />
          <Image
            src="/img/text-white.png"
            alt="La Guía del Streaming"
            width={120}
            height={44}
            style={{ objectFit: 'contain' }}
          />
        </Box>
      </Toolbar>
      <List>
        {menuItems.map(item => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => router.push(item.path)}
              selected={item.path === '/backoffice' ? pathname === item.path : pathname.startsWith(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  '& .MuiListItemIcon-root': {
                    color: '#3b82f6',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#3b82f6',
                  },
                },
                '& .MuiListItemIcon-root': {
                  color: '#cbd5e1',
                },
                '& .MuiListItemText-primary': {
                  color: '#f1f5f9',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
    }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'rgba(15,23,42,0.9)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(o => !o)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography sx={{ flexGrow: 1, color: '#f1f5f9' }}>
            Panel de Administración
          </Typography>
          <UserMenu onLogout={handleLogout} showHomeOption={true} />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(o => !o)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: '#1e293b',
              borderRight: '1px solid rgba(255,255,255,0.1)',
            }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: 'rgba(30,41,59,0.9)',
              backdropFilter: 'blur(8px)',
              borderRight: '1px solid rgba(255,255,255,0.1)',
            }
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}