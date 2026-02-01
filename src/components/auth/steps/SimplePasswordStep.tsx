import React from 'react';
import {
    Box,
    TextField,
    Button,
    IconButton,
    InputAdornment,
    Typography,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

interface SimplePasswordStepProps {
    password: string;
    setPassword: (value: string) => void;
    onSubmit: () => void;
    onForgotPassword?: () => void;
    isLoading: boolean;
    error: string;
    showPassword: boolean;
    setShowPassword: (show: boolean) => void;
    onBack: () => void;
    identifier: string;
}

export default function SimplePasswordStep({
    password,
    setPassword,
    onSubmit,
    onForgotPassword,
    isLoading,
    error,
    showPassword,
    setShowPassword,
    onBack,
    identifier
}: SimplePasswordStepProps) {

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSubmit();
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                    Ingresa la contraseña para {identifier}
                </Typography>
            </Box>

            <TextField
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                autoFocus
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />

            {error && (
                <Alert severity="error">
                    {error}
                </Alert>
            )}

            {onForgotPassword && (
                <Button
                    variant="text"
                    size="small"
                    onClick={onForgotPassword}
                    sx={{ alignSelf: 'flex-end', textTransform: 'none' }}
                >
                    ¿Olvidaste tu contraseña?
                </Button>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={onBack}
                    disabled={isLoading}
                    startIcon={<ArrowBackIcon />}
                    sx={{ flex: 1 }}
                >
                    Volver
                </Button>
                <Button
                    variant="contained"
                    onClick={onSubmit}
                    disabled={isLoading || !password}
                    sx={{ flex: 2 }}
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                </Button>
            </Box>
        </Box>
    );
}
