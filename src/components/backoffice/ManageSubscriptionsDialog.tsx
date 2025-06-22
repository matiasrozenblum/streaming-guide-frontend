'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Divider,
} from '@mui/material';
import { Delete, Edit, Save, Cancel, Add } from '@mui/icons-material';
import { User } from '@/types/user';
import { UserSubscription, NotificationMethod } from '@/types/user-subscription';
import { Program } from '@/types/program';
import { SessionWithToken } from '@/types/session';
import { useState, useEffect } from 'react';

const notificationMethodTranslations: Record<string, string> = {
  push: 'Push',
  email: 'Email',
  both: 'Ambos',
};

interface ManageSubscriptionsDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  session: SessionWithToken | null;
  onSubscriptionsUpdate: () => void;
}

export function ManageSubscriptionsDialog({ open, onClose, user, session, onSubscriptionsUpdate }: ManageSubscriptionsDialogProps) {
  const [editingSub, setEditingSub] = useState<UserSubscription | null>(null);
  const [newMethod, setNewMethod] = useState<NotificationMethod>(NotificationMethod.EMAIL);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [newSubProgramId, setNewSubProgramId] = useState<string>('');

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await fetch('/api/programs', { 
          headers: { Authorization: `Bearer ${session?.accessToken}` } 
        });
        if (!res.ok) throw new Error('Failed to fetch programs');
        const data = await res.json();
        setAllPrograms(data);
      } catch (error) {
        console.error(error);
      }
    };
    if (open) {
      fetchPrograms();
    }
  }, [open, session]);

  if (!user) return null;

  const handleUpdate = async (sub: UserSubscription) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${sub.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ notificationMethod: newMethod }),
      });
      if (!res.ok) throw new Error('Failed to update');
      onSubscriptionsUpdate();
      setEditingSub(null);
    } catch (error) {
      console.error(error);
      alert('Failed to update subscription');
    }
  };

  const handleDelete = async (subId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/subscriptions/${subId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      onSubscriptionsUpdate();
    } catch (error) {
      console.error(error);
      alert('Failed to delete subscription');
    }
  };
  
  const handleCreate = async () => {
    if (!newSubProgramId) return;
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ 
          userId: user.id, 
          programId: Number(newSubProgramId), 
          notificationMethod: NotificationMethod.EMAIL // Admins can only create email subs
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create');
      }
      onSubscriptionsUpdate();
      setNewSubProgramId('');
    } catch (error) {
      console.error(error);
      alert(`Failed to create subscription: ${(error as Error).message}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Suscripciones de: {user.firstName} {user.lastName}</DialogTitle>
      <DialogContent>
        <Box mt={2}>
          <Typography variant="h6" gutterBottom>Añadir Suscripción</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>Programa</InputLabel>
              <Select
                value={newSubProgramId}
                label="Programa"
                onChange={(e) => setNewSubProgramId(e.target.value)}
              >
                {allPrograms.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
              disabled={!newSubProgramId}
            >
              Añadir
            </Button>
          </Box>
        </Box>
        <Divider sx={{ my: 3 }} />
        {user.subscriptions && user.subscriptions.length > 0 ? (
          <List>
            {user.subscriptions.map((sub) => (
              <ListItem
                key={sub.id}
                secondaryAction={
                  editingSub?.id === sub.id ? (
                    <Box>
                      <IconButton onClick={() => handleUpdate(sub)}><Save /></IconButton>
                      <IconButton onClick={() => setEditingSub(null)}><Cancel /></IconButton>
                    </Box>
                  ) : (
                    <Box>
                      <IconButton onClick={() => {
                        setEditingSub(sub);
                        setNewMethod(sub.notificationMethod);
                      }}><Edit /></IconButton>
                      <IconButton onClick={() => handleDelete(sub.id)}><Delete /></IconButton>
                    </Box>
                  )
                }
              >
                <ListItemText
                  primary={sub.program.name}
                  secondary={
                    editingSub?.id === sub.id ? (
                      <FormControl size="small" sx={{ mt: 1 }}>
                        <Select
                          value={newMethod}
                          onChange={(e) => setNewMethod(e.target.value as NotificationMethod)}
                        >
                          <MenuItem value="email">Email</MenuItem>
                          <MenuItem value="push">Push</MenuItem>
                          <MenuItem value="both">Ambos</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      notificationMethodTranslations[sub.notificationMethod]
                    )
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info" sx={{ mt: 1 }}>
            Este usuario no tiene suscripciones.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
} 