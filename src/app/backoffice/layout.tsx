'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemIcon, ListItemText, IconButton, ListItemButton } from '@mui/material';
import { Menu as MenuIcon, Dashboard, LiveTv, People, Schedule, ScheduleTwoTone } from '@mui/icons-material';
import { AuthService } from '@/services/auth';

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('Checking authentication for path:', pathname);
    if (!AuthService.isAuthenticated(true)) {
      console.log('Not authenticated, redirecting to login');
      router.push('/backoffice_login');
    }
  }, [pathname, router]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    console.log('Logging out');
    AuthService.logout(true);
    router.push('/backoffice_login');
  };

  const drawerWidth = 240;

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/backoffice' },
    { text: 'Canales', icon: <LiveTv />, path: '/backoffice/channels' },
    { text: 'Programas', icon: <Schedule />, path: '/backoffice/programs' },
    { text: 'Panelistas', icon: <People />, path: '/backoffice/panelists' },
    { text: 'Horarios', icon: <Schedule />, path: '/backoffice/schedules' },
    { text: 'Configuraciones', icon: <Schedule />, path: '/backoffice/configs' },
    { text: 'Cambios Propuestos', icon: <ScheduleTwoTone />, path: '/backoffice/changes' },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Streaming Guide
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => router.push(item.path)}
              sx={{
                minHeight: 48,
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: 3,
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Panel de Administración
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            Salir
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
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
        }}
      >
        {children}
      </Box>
    </Box>
  );
} 