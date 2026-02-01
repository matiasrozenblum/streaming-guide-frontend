import React from 'react';
import {
    Box,
    TextField,
    Button,
    ToggleButton,
    ToggleButtonGroup,
    InputAdornment,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
} from '@mui/icons-material';

type AuthMethod = 'email' | 'phone';

interface IdentifierStepProps {
    identifier: string;
    setIdentifier: (value: string) => void;
    method: AuthMethod;
    setMethod: (method: AuthMethod) => void;
    onSubmit: () => void;
    isLoading: boolean;
    error: string;
}

export default function IdentifierStep({
    identifier,
    setIdentifier,
    method,
    setMethod,
    onSubmit,
    isLoading,
    error
}: IdentifierStepProps) {

    const handleMethodChange = (
        event: React.MouseEvent<HTMLElement>,
        newMethod: AuthMethod | null,
    ) => {
        if (newMethod !== null) {
            setMethod(newMethod);
            setIdentifier('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSubmit();
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <ToggleButtonGroup
                    value={method}
                    exclusive
                    onChange={handleMethodChange}
                    aria-label="auth method"
                    sx={{
                        '& .MuiToggleButton-root': {
                            color: 'text.secondary',
                            borderColor: 'rgba(255, 255, 255, 0.12)',
                            '&.Mui-selected': {
                                color: 'primary.main',
                                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                            },
                        },
                    }}
                >
                    <ToggleButton value="email" aria-label="email">
                        <EmailIcon sx={{ mr: 1 }} />
                        Email
                    </ToggleButton>
                    <ToggleButton value="phone" aria-label="phone">
                        <PhoneIcon sx={{ mr: 1 }} />
                        Teléfono
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <TextField
                fullWidth
                label={method === 'email' ? 'Correo electrónico' : 'Número de teléfono'}
                placeholder={method === 'email' ? 'ejemplo@correo.com' : '+54 9 11 1234 5678'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                autoFocus
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            {method === 'email' ? <EmailIcon fontSize="small" /> : <PhoneIcon fontSize="small" />}
                        </InputAdornment>
                    ),
                }}
            />

            {error && (
                <Alert severity="error">
                    {error}
                </Alert>
            )}

            <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={onSubmit}
                disabled={isLoading || !identifier}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
                {isLoading ? 'Verificando...' : 'Continuar'}
            </Button>
        </Box>
    );
}
