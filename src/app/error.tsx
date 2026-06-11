'use client';

import { useEffect } from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Unhandled app error:', error);
    }, [error]);

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box
            sx={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
                background: isDark
                    ? 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)'
                    : 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)',
            }}
        >
            <Box
                sx={{
                    maxWidth: 380,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    textAlign: 'center',
                }}
            >
                {/* Logo */}
                <Box
                    component="img"
                    src={isDark ? '/img/text-white.png' : '/img/text.png'}
                    alt="La Guía del Streaming"
                    sx={{ height: 36, width: 'auto' }}
                />

                {/* Icon – amber wifi ring */}
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        bgcolor: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <svg
                        width="40"
                        height="40"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                    >
                        <path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                </Box>

                {/* Text */}
                <Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        Problemas técnicos
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Estamos teniendo inconvenientes técnicos.
                        <br />
                        El sitio estará disponible nuevamente en breve.
                    </Typography>
                </Box>

                {/* Buttons */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={() => reset()}
                        sx={{ borderRadius: 3, py: 1.5, fontWeight: 600 }}
                    >
                        Intentar de nuevo
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        fullWidth
                        onClick={() => window.location.reload()}
                        sx={{ borderRadius: 3, py: 1.5, fontWeight: 600 }}
                    >
                        Recargar página
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
