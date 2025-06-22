'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { User } from '@/types/user';
import { Device } from '@/types/device';
import { SessionWithToken } from '@/types/session';

interface ManageUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  session: SessionWithToken | null;
  onDeviceDeleted: () => void;
}

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      const msg = (error as { message: unknown }).message;
      if (typeof msg === 'string') return msg;
      if (Array.isArray(msg)) return msg.join(', ');
    }
    return 'An unknown error occurred';
};

export function ManageUserDialog({ open, onClose, user, session, onDeviceDeleted }: ManageUserDialogProps) {
  if (!user) return null;

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(getErrorMessage(errorData));
      }
      
      onDeviceDeleted();
    } catch (error) {
      alert(`Failed to delete device: ${getErrorMessage(error)}`);
    }
  };

  const renderDeviceDetails = (device: Device) => {
    const details = [
      `Device ID: ${device.deviceId.substring(0, 8)}...`,
      `Type: ${device.deviceType || 'Unknown'}`,
      `Name: ${device.deviceName || 'Unknown'}`,
      `User Agent: ${device.userAgent || 'N/A'}`,
      `Last Seen: ${device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}`,
    ].join(' | ');

    return details;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Manage User: {user.firstName} {user.lastName}</DialogTitle>
      <DialogContent>
        {/* Devices Section */}
        <Box mt={2}>
          <Typography variant="h6">Devices</Typography>
          {user.devices && user.devices.length > 0 ? (
            <List>
              {user.devices.map((device) => (
                <ListItem
                  key={device.id}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteDevice(device.id)}>
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primaryTypographyProps={{ variant: 'body2', sx: { fontFamily: 'monospace' } }}
                    primary={renderDeviceDetails(device)}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info" sx={{ mt: 1 }}>No devices found for this user.</Alert>
          )}
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Subscriptions Section (to be implemented) */}
        <Box>
          <Typography variant="h6">Subscriptions</Typography>
           <Alert severity="info" sx={{ mt: 1 }}>Subscription management coming soon.</Alert>
        </Box>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 