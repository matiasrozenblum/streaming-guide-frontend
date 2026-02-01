import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    InputAdornment,
    MenuItem,
    IconButton,
    Alert
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

interface RegisterStepProps {
    userData: {
        firstName: string;
        lastName: string;
        birthDate: string;
        gender: string;
        password?: string;
        confirmPassword?: string;
    };
    setUserData: (data: Partial<{
        firstName: string;
        lastName: string;
        birthDate: string;
        gender: string;
        password?: string;
        confirmPassword?: string;
    }>) => void;
    onSubmit: () => void;
    isLoading: boolean;
    error: string;
    onBack: () => void;
}

export default function RegisterStep({
    userData,
    setUserData,
    onSubmit,
    isLoading,
    error,
    onBack
}: RegisterStepProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Helper to update specific fields
    const handleChange = (field: string, value: string) => {
        setUserData({ ...userData, [field]: value });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSubmit();
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    label="Nombre"
                    fullWidth
                    value={userData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    disabled={isLoading}
                />
                <TextField
                    label="Apellido"
                    fullWidth
                    value={userData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    disabled={isLoading}
                />
            </Box>

            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                <DatePicker
                    label="Fecha de nacimiento"
                    value={userData.birthDate ? dayjs(userData.birthDate) : null}
                    onChange={(newValue) => handleChange('birthDate', newValue ? newValue.format('YYYY-MM-DD') : '')}
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            disabled: isLoading
                        }
                    }}
                />
            </LocalizationProvider>

            <TextField
                select
                label="Género"
                fullWidth
                value={userData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                disabled={isLoading}
            >
                <MenuItem value="masculino">Masculino</MenuItem>
                <MenuItem value="femenino">Femenino</MenuItem>
                <MenuItem value="no_binario">No binario</MenuItem>
                <MenuItem value="prefiero_no_decir">Prefiero no decir</MenuItem>
                <MenuItem value="rather_not_say">Prefiero no decir</MenuItem>
            </TextField>

            <TextField
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={userData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                disabled={isLoading}
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

            <TextField
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                value={userData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                            >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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

            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
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
                    disabled={isLoading}
                    sx={{ flex: 2 }}
                >
                    {isLoading ? 'Registrando...' : 'Registrarse'}
                </Button>
            </Box>
        </Box>
    );
}
