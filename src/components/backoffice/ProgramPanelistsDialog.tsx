'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Autocomplete,
  Chip,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Panelist } from '@/types/panelist';
import { Program } from '@/types/program';
import { PanelistsService } from '@/services/panelists';

interface Props {
  open: boolean;
  onClose: () => void;
  program: Program;
  onError: (message: string) => void;
}

export default function ProgramPanelistsDialog({ open, onClose, program, onError }: Props) {
  const [panelists, setPanelists] = useState<Panelist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPanelists, setSelectedPanelists] = useState<Panelist[]>([]);

  const fetchPanelists = async () => {
    try {
      setLoading(true);
      const data = await PanelistsService.getAll();
      setPanelists(data);
    } catch (error) {
      onError('Error loading panelists');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && program) {
      fetchPanelists();
      setSelectedPanelists(program.panelists || []);
    }
  }, [open, program, fetchPanelists]);

  const handleAddPanelist = async (panelist: Panelist) => {
    try {
      await PanelistsService.addToProgram(panelist.id, program.id);
      setSelectedPanelists([...selectedPanelists, panelist]);
      setSearchQuery('');
    } catch (error) {
      onError('Error adding panelist to program');
      console.error('Error:', error);
    }
  };

  const handleRemovePanelist = async (panelist: Panelist) => {
    try {
      await PanelistsService.removeFromProgram(panelist.id, program.id);
      setSelectedPanelists(selectedPanelists.filter(p => p.id !== panelist.id));
    } catch (error) {
      onError('Error removing panelist from program');
      console.error('Error:', error);
    }
  };

  const handleCreateAndAddPanelist = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      // First create the panelist
      const newPanelist = await PanelistsService.create(searchQuery);
      
      // Then add it to the program
      await PanelistsService.addToProgram(newPanelist.id, program.id);
      
      // Update the local state
      setPanelists([...panelists, newPanelist]);
      setSelectedPanelists([...selectedPanelists, newPanelist]);
      setSearchQuery('');
    } catch (error) {
      onError('Error creating and adding panelist');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPanelists = panelists.filter(
    panelist => 
      panelist.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedPanelists.some(p => p.id === panelist.id)
  );

  if (!program) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Panelists for {program.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {/* Search and Add/Create Panelist */}
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <Autocomplete
              options={filteredPanelists}
              getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
              inputValue={searchQuery}
              onInputChange={(_, newValue) => setSearchQuery(newValue)}
              onChange={(_, newValue) => {
                if (newValue && typeof newValue !== 'string') {
                  handleAddPanelist(newValue);
                }
              }}
              sx={{ flex: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search or create panelist"
                  fullWidth
                  sx={{ minWidth: 300 }}
                />
              )}
              loading={loading}
              renderOption={(props, option) => (
                <li {...props} key={typeof option === 'string' ? option : option.id}>
                  {typeof option === 'string' ? option : option.name}
                </li>
              )}
              freeSolo
              disableClearable
            />
            {searchQuery && (
              <Button
                variant="contained"
                onClick={handleCreateAndAddPanelist}
                disabled={!searchQuery.trim()}
                sx={{ minWidth: 120 }}
              >
                Create & Add
              </Button>
            )}
          </Box>

          {/* Selected Panelists */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Panelists
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedPanelists.map((panelist) => (
                <Chip
                  key={panelist.id}
                  label={panelist.name}
                  onDelete={() => handleRemovePanelist(panelist)}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 