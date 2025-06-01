'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { User } from '@/types/user';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';

// Helper to extract error messages
function getErrorMessage(err: unknown): string {
  if (!err) return 'Error desconocido';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;
    if ('message' in obj) {
      const msg = obj.message;
      if (Array.isArray(msg)) return msg.join(' | ');
      if (typeof msg === 'string') return msg;
    }
    if ('details' in obj && typeof obj.details === 'string') {
      return obj.details;
    }
  }
  return JSON.stringify(err);
}

const genderTranslations: Record<string, string> = {
  male: 'Masculino',
  female: 'Femenino',
  non_binary: 'No binario',
  rather_not_say: 'Prefiero no decir'
};

type Gender = 'male' | 'female' | 'non_binary' | 'rather_not_say';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'user';
  gender: Gender | '';
  birthDate: string;
}

export function UsersTable() {
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    gender: '',
    birthDate: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${typedSession?.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError('Error loading users');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [typedSession?.accessToken]);

  useEffect(() => {
    if (typedSession?.accessToken) {
      fetchUsers();
    }
  }, [fetchUsers, typedSession?.accessToken]);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '', // Don't show current password
        role: user.role === 'admin' ? 'admin' : 'user',
        gender: user.gender || '',
        birthDate: user.birthDate ? user.birthDate.slice(0, 10) : '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'user',
        gender: '',
        birthDate: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'user',
      gender: '',
      birthDate: '',
    });
  };

  const validateFields = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.firstName.trim()) {
      errors.firstName = 'El nombre es obligatorio.';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'El apellido es obligatorio.';
    }
    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else {
      if (!formData.email.includes('@')) {
        errors.email = 'El correo electrónico debe contener un "@"';
      } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
        errors.email = 'El correo electrónico debe tener un formato válido (ejemplo: usuario@ejemplo.com)';
      }
    }
    if (formData.phone && !/^\+?\d{7,15}$/.test(formData.phone)) {
      errors.phone = 'El teléfono debe estar en formato internacional (ej: +5491123456789)';
    }
    if (!editingUser && !formData.password) {
      errors.password = 'La contraseña es obligatoria para nuevos usuarios.';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (!formData.gender) {
      errors.gender = 'El género es obligatorio.';
    }
    if (!formData.birthDate) {
      errors.birthDate = 'La fecha de nacimiento es obligatoria.';
    } else {
      // Validate 18+
      const birth = new Date(formData.birthDate);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 18) {
        errors.birthDate = 'El usuario debe ser mayor de 18 años.';
      }
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';
  
      // Remove empty string fields
      const filteredFormData = Object.fromEntries(
        Object.entries(formData).filter(([, v]) => v !== '')
      );
  
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typedSession?.accessToken}`,
        },
        body: JSON.stringify(filteredFormData),
      });
  
      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch {
          data = {};
        }
        throw new Error(getErrorMessage(data));
      }
  
      handleCloseDialog();
      fetchUsers();
      setSuccess(editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
    } catch (error) {
      setError(getErrorMessage(error));
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro que deseas eliminar este usuario?')) return;
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${typedSession?.accessToken}`,
        },
      });
      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch {
          data = {};
        }
        throw new Error(getErrorMessage(data));
      }
      fetchUsers();
      setSuccess('Usuario eliminado correctamente');
    } catch (error) {
      setError(getErrorMessage(error));
      console.error('Error:', error);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Usuarios</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Nuevo Usuario
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          label="Buscar usuario..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, apellido, email o teléfono"
          inputProps={{ style: { color: 'black' } }}
          InputLabelProps={{ style: { color: 'black' } }}
          sx={{
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'black',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'black',
            },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'black',
            },
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Género</TableCell>
              <TableCell>Fecha de nacimiento</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.firstName}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                </TableCell>
                <TableCell>
                  {user.gender ? genderTranslations[user.gender] : '—'}
                </TableCell>
                <TableCell>
                  {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(user)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(user.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={3} mt={2}>
              <TextField
                label="Nombre"
                value={formData.firstName}
                onChange={e => {
                  setFormData({ ...formData, firstName: e.target.value });
                  setFieldErrors(prev => ({ ...prev, firstName: '' }));
                }}
                fullWidth
                required
                error={!!fieldErrors.firstName}
                helperText={fieldErrors.firstName || ''}
              />
              <TextField
                label="Apellido"
                value={formData.lastName}
                onChange={e => {
                  setFormData({ ...formData, lastName: e.target.value });
                  setFieldErrors(prev => ({ ...prev, lastName: '' }));
                }}
                fullWidth
                required
                error={!!fieldErrors.lastName}
                helperText={fieldErrors.lastName || ''}
              />
              <TextField
                label="Email"
                type="text"
                value={formData.email}
                onChange={e => {
                  setFormData({ ...formData, email: e.target.value });
                  setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
                fullWidth
                required
                error={!!fieldErrors.email}
                helperText={fieldErrors.email || ''}
              />
              <TextField
                label="Teléfono"
                value={formData.phone}
                onChange={e => {
                  setFormData({ ...formData, phone: e.target.value });
                  setFieldErrors(prev => ({ ...prev, phone: '' }));
                }}
                fullWidth
                error={!!fieldErrors.phone}
                helperText={fieldErrors.phone || ''}
              />
              <FormControl fullWidth>
                <InputLabel id="role-label">Rol</InputLabel>
                <Select
                  labelId="role-label"
                  id="role"
                  value={formData.role}
                  label="Rol"
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value as 'admin' | 'user' });
                    setFieldErrors(prev => ({ ...prev, role: '' }));
                  }}
                >
                  <MenuItem value="user">Usuario</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="gender-label">Género</InputLabel>
                <Select
                  labelId="gender-label"
                  value={formData.gender}
                  label="Género"
                  onChange={(e) => {
                    setFormData({ ...formData, gender: e.target.value as Gender });
                    setFieldErrors(prev => ({ ...prev, gender: '' }));
                  }}
                  error={!!fieldErrors.gender}
                >
                  <MenuItem value="male">Masculino</MenuItem>
                  <MenuItem value="female">Femenino</MenuItem>
                  <MenuItem value="non_binary">No binario</MenuItem>
                  <MenuItem value="rather_not_say">Prefiero no decir</MenuItem>
                </Select>
                {fieldErrors.gender && <Typography color="error" variant="caption">{fieldErrors.gender}</Typography>}
              </FormControl>
              <TextField
                label="Fecha de nacimiento"
                type="date"
                value={formData.birthDate}
                onChange={e => {
                  setFormData({ ...formData, birthDate: e.target.value });
                  setFieldErrors(prev => ({ ...prev, birthDate: '' }));
                }}
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!fieldErrors.birthDate}
                helperText={fieldErrors.birthDate || ''}
              />
              <TextField
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={e => {
                  setFormData({ ...formData, password: e.target.value });
                  setFieldErrors(prev => ({ ...prev, password: '' }));
                }}
                fullWidth
                required={!editingUser}
                error={!!fieldErrors.password}
                helperText={fieldErrors.password || (editingUser ? 'Dejar en blanco para mantener la contraseña actual' : '')}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {error && (
              <Alert
                severity="error"
                variant="outlined"
                sx={{
                  mr: 2,
                  minWidth: 0,
                  maxWidth: 320,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.95rem',
                  flex: 1,
                  whiteSpace: 'pre-line',
                }}
              >
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit" variant="contained">
                {editingUser ? 'Guardar' : 'Crear'}
              </Button>
            </Box>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
} 