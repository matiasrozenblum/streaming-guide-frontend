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
import { Delete, Add } from '@mui/icons-material';
import { User } from '@/types/user';

import { Program } from '@/types/program';
import { SessionWithToken } from '@/types/session';
import { useState, useEffect } from 'react';

interface ManageSubscriptionsDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  session: SessionWithToken | null;
  onSubscriptionsUpdate: () => void;
}

export function ManageSubscriptionsDialog({ open, onClose, user, session, onSubscriptionsUpdate }: ManageSubscriptionsDialogProps) {
  // notificationMethod related state removed
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

  // Let's assume for now we just remove the field from the payload or remove the update capability if it's solely for that.
  // Given the context, I'll comment it out or remove the editable part.
  // But wait, the dialog allows editing. If I remove the only editable field, the edit button becomes useless.
  // Let's remove the edit functionality for now since there's nothing to edit.

  // Changing approach: The dialog allows deleting and "editing". 
  // Since "editing" was only for notification method, I will remove the edit button and the handleUpdate function.


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
          // notificationMethod removed
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
                  <Box>
                    <IconButton onClick={() => handleDelete(sub.id)}><Delete /></IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={sub.program.name}
                // Removed secondary text which showed notification method
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