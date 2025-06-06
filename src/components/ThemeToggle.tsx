import { IconButton, Tooltip } from '@mui/material';
import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import { useThemeContext } from '@/contexts/ThemeContext';

export const ThemeToggle = () => {
  const { mode, toggleTheme } = useThemeContext();

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`} arrow>
      <IconButton
        onClick={toggleTheme}
        size="large"
        sx={{
          width: 44,
          height: 44,
          backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {mode === 'light' ? (
          <DarkModeOutlined style={{ color: '#1e293b' }} />
        ) : (
          <LightModeOutlined style={{ color: '#f1f5f9' }} />
        )}
      </IconButton>
    </Tooltip>
  );
};