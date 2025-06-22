'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import { User } from '@/types/user';

interface ManageSubscriptionsDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

export function ManageSubscriptionsDialog({ open, onClose, user }: ManageSubscriptionsDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Suscripciones de: {user.firstName} {user.lastName}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mt: 1 }}>
          La gestión de suscripciones estará disponible próximamente.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
} 