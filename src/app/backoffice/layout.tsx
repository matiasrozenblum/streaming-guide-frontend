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
  Mic
} from '@mui/icons-material';
import type { SessionWithToken } from '@/types/session';

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, status } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const router   = useRouter();
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

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const drawerWidth = 240;
  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/backoffice' },
    { text: 'Canales',   icon: <LiveTv />,     path: '/backoffice/channels' },
    { text: 'Programas',  icon: <Movie />,   path: '/backoffice/programs' },
    { text: 'Panelistas', icon: <Mic />,     path: '/backoffice/panelists' },
    { text: 'Horarios',   icon: <Schedule />,   path: '/backoffice/schedules' },
    { text: 'Configs',    icon: <ToggleOn />, path: '/backoffice/configs' },
    { text: 'Cambios',    icon: <TrackChanges />, path: '/backoffice/changes' },
    { text: 'Usuarios',   icon: <People />,     path: '/backoffice/users' },
  ];

  const drawer = (
    <Box>
      <Toolbar><Typography variant="h6">Streaming Guide</Typography></Toolbar>
      <List>
        {menuItems.map(item => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => router.push(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display:'flex' }}>
      <AppBar position="fixed"
        sx={{ width:{ sm:`calc(100% - ${drawerWidth}px)` }, ml:{ sm:`${drawerWidth}px` } }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={()=>setMobileOpen(o=>!o)}
            sx={{ mr:2, display:{ sm:'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography sx={{ flexGrow:1 }}>Panel de Administración</Typography>
          <IconButton color="inherit" onClick={handleLogout}>Salir</IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width:{ sm:drawerWidth }, flexShrink:{ sm:0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={()=>setMobileOpen(o=>!o)}
          ModalProps={{ keepMounted:true }}
          sx={{ display:{ xs:'block', sm:'none' },
                '& .MuiDrawer-paper':{ boxSizing:'border-box', width:drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer variant="permanent" open
          sx={{ display:{ xs:'none', sm:'block' },
                '& .MuiDrawer-paper':{ boxSizing:'border-box', width:drawerWidth } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{
        flexGrow:1, p:3,
        width:{ sm:`calc(100% - ${drawerWidth}px)` },
        mt:'64px'
      }}>
        {children}
      </Box>
    </Box>
  );
}