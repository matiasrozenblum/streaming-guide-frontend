'use client';

import { useState, useEffect } from 'react';
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
  Chip,
  Autocomplete,
} from '@mui/material';
import { Edit, Delete, Add, Group } from '@mui/icons-material';
import { Panelist } from '@/types/panelist';
import { Program } from '@/types/program';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PanelistsTableProps {
  onError: (message: string) => void;
}

export default function PanelistsTable({ onError }: PanelistsTableProps) {
  const [panelists, setPanelists] = useState<Panelist[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openProgramsDialog, setOpenProgramsDialog] = useState(false);
  const [editingPanelist, setEditingPanelist] = useState<Panelist | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    avatar_url: '',
  });
  const [selectedPrograms, setSelectedPrograms] = useState<Program[]>([]);

  useEffect(() => {
    fetchPanelists();
    fetchPrograms();
  }, []);

  const fetchPanelists = async () => {
    try {
      const response = await fetch(`${API_URL}/panelists`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch panelists');
      const data = await response.json();
      setPanelists(data);
    } catch (error) {
      onError('Error loading panelists');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      if (!response.ok) throw new Error('Failed to fetch programs');
      const data = await response.json();
      setPrograms(data);
    } catch (error) {
      onError('Error loading programs');
      console.error('Error:', error);
    }
  };

  const handleOpenDialog = (panelist?: Panelist) => {
    if (panelist) {
      setEditingPanelist(panelist);
      setFormData({
        name: panelist.name,
        avatar_url: panelist.avatar_url || '',
      });
      setSelectedPrograms(panelist.programs || []);
    } else {
      setEditingPanelist(null);
      setFormData({
        name: '',
        avatar_url: '',
      });
      setSelectedPrograms([]);
    }
    setOpenDialog(true);
  };

  const handleOpenProgramsDialog = (panelist: Panelist) => {
    setEditingPanelist(panelist);
    setSelectedPrograms(panelist.programs || []);
    setOpenProgramsDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPanelist(null);
    setFormData({
      name: '',
      avatar_url: '',
    });
    setSelectedPrograms([]);
  };

  const handleCloseProgramsDialog = () => {
    setOpenProgramsDialog(false);
    setEditingPanelist(null);
    setSelectedPrograms([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPanelist
        ? `${API_URL}/panelists/${editingPanelist.id}`
        : `${API_URL}/panelists`;
      const method = editingPanelist ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save panelist');
      handleCloseDialog();
      fetchPanelists();
    } catch (error) {
      onError('Error saving panelist');
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this panelist?')) return;
    try {
      const response = await fetch(`${API_URL}/panelists/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete panelist');
      fetchPanelists();
    } catch (error) {
      onError('Error deleting panelist');
      console.error('Error:', error);
    }
  };

  const handleAddToProgram = async (programId: number) => {
    if (!editingPanelist) return;
    try {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `/api/panelists/${editingPanelist.id}/programs/${programId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to add panelist to program');
      fetchPanelists();
    } catch (error) {
      onError('Error adding panelist to program');
      console.error('Error:', error);
    }
  };

  const handleRemoveFromProgram = async (programId: number) => {
    if (!editingPanelist) return;
    try {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `/api/panelists/${editingPanelist.id}/programs/${programId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to remove panelist from program');
      fetchPanelists();
    } catch (error) {
      onError('Error removing panelist from program');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Panelists</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Panelist
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Avatar</TableCell>
              <TableCell>Programs</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {panelists.map((panelist) => (
              <TableRow key={panelist.id}>
                <TableCell>{panelist.name}</TableCell>
                <TableCell>
                  {panelist.avatar_url && (
                    <img
                      src={panelist.avatar_url}
                      alt={panelist.name}
                      style={{ width: 50, height: 50, objectFit: 'cover' }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {panelist.programs?.map((program) => (
                      <Chip
                        key={program.id}
                        label={program.name}
                        onDelete={() => handleRemoveFromProgram(program.id)}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(panelist)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleOpenProgramsDialog(panelist)}>
                    <Group />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(panelist.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingPanelist ? 'Edit Panelist' : 'Add Panelist'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <TextField
              margin="dense"
              label="Avatar URL"
              fullWidth
              value={formData.avatar_url}
              onChange={(e) =>
                setFormData({ ...formData, avatar_url: e.target.value })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingPanelist ? 'Save' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openProgramsDialog} onClose={handleCloseProgramsDialog}>
        <DialogTitle>Manage Programs</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={programs.filter(
                (program) =>
                  !selectedPrograms.some((p) => p.id === program.id)
              )}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField {...params} label="Add to Program" fullWidth />
              )}
              onChange={(_, value) => {
                if (value) {
                  handleAddToProgram(value.id);
                }
              }}
            />
            <Box sx={{ mt: 2 }}>
              {selectedPrograms.map((program) => (
                <Chip
                  key={program.id}
                  label={program.name}
                  onDelete={() => handleRemoveFromProgram(program.id)}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProgramsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 