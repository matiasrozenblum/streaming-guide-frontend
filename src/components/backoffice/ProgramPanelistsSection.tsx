'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Autocomplete,
  Chip,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore,
  Group as GroupIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Panelist } from '@/types/panelist';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';

interface ProgramPanelistsSectionProps {
  programId?: number | null; // undefined/null means new program
  onPanelistsChange?: (panelistIds: number[]) => void; // For new programs
}

export function ProgramPanelistsSection({ 
  programId, 
  onPanelistsChange 
}: ProgramPanelistsSectionProps) {
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;

  const [allPanelists, setAllPanelists] = useState<Panelist[]>([]);
  const [selectedPanelists, setSelectedPanelists] = useState<Panelist[]>([]);
  const [pendingPanelistIds, setPendingPanelistIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('panelists');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAllPanelists = useCallback(async () => {
    try {
      const response = await fetch('/api/panelists');
      if (!response.ok) throw new Error('Failed to fetch panelists');
      const data = await response.json();
      setAllPanelists(data);
    } catch (err) {
      console.error('Error fetching panelists:', err);
      setError('Error al cargar los panelistas');
    }
  }, []);

  const fetchProgramPanelists = useCallback(async () => {
    if (!programId || !typedSession?.accessToken) return;
    
    setLoading(true);
    try {
      // Fetch program with panelists - backend includes panelists in findOne response
      const response = await fetch(`/api/programs/${programId}`, {
        headers: {
          'Authorization': `Bearer ${typedSession.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch program');
      const program = await response.json();
      setSelectedPanelists(program.panelists || []);
    } catch (err) {
      console.error('Error fetching program panelists:', err);
      setError('Error al cargar los panelistas del programa');
    } finally {
      setLoading(false);
    }
  }, [programId, typedSession?.accessToken]);

  // Fetch all panelists for search/autocomplete
  useEffect(() => {
    if (typedSession?.accessToken) {
      fetchAllPanelists();
    }
  }, [typedSession?.accessToken, fetchAllPanelists]);

  // Fetch program panelists when programId is available (existing program)
  useEffect(() => {
    if (programId && typedSession?.accessToken) {
      fetchProgramPanelists();
    } else {
      setSelectedPanelists([]);
    }
  }, [programId, typedSession?.accessToken, fetchProgramPanelists]);

  // Notify parent of pending panelist IDs changes
  useEffect(() => {
    if (onPanelistsChange && !programId) {
      onPanelistsChange(pendingPanelistIds);
    }
  }, [pendingPanelistIds, programId, onPanelistsChange]);

  const handleAddPanelist = async (panelist: Panelist) => {
    // If program doesn't exist yet, add to pending list
    if (!programId) {
      if (!pendingPanelistIds.includes(panelist.id)) {
        setPendingPanelistIds([...pendingPanelistIds, panelist.id]);
        setSelectedPanelists([...selectedPanelists, panelist]);
        setSuccess('Panelista agregado (se asociará al guardar el programa)');
      }
      setSearchQuery('');
      return;
    }

    // If program exists, add panelist immediately
    if (!typedSession?.accessToken) {
      setError('Debes estar autenticado');
      return;
    }

    try {
      const response = await fetch(`/api/panelists/${panelist.id}/programs/${programId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${typedSession.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to add panelist to program');

      setSelectedPanelists([...selectedPanelists, panelist]);
      setSearchQuery('');
      setSuccess('Panelista agregado correctamente');
    } catch (err) {
      console.error('Error adding panelist:', err);
      setError('Error al agregar el panelista');
    }
  };

  const handleRemovePanelist = async (panelist: Panelist) => {
    // If program doesn't exist yet, remove from pending list
    if (!programId) {
      setPendingPanelistIds(pendingPanelistIds.filter(id => id !== panelist.id));
      setSelectedPanelists(selectedPanelists.filter(p => p.id !== panelist.id));
      setSuccess('Panelista removido');
      return;
    }

    // If program exists, remove panelist immediately
    if (!typedSession?.accessToken) {
      setError('Debes estar autenticado');
      return;
    }

    try {
      const response = await fetch(`/api/panelists/${panelist.id}/programs/${programId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${typedSession.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to remove panelist from program');

      setSelectedPanelists(selectedPanelists.filter(p => p.id !== panelist.id));
      setSuccess('Panelista removido correctamente');
    } catch (err) {
      console.error('Error removing panelist:', err);
      setError('Error al remover el panelista');
    }
  };

  const handleCreateAndAddPanelist = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // 1. Create the panelist
      const createResponse = await fetch('/api/panelists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${typedSession?.accessToken}`,
        },
        body: JSON.stringify({ name: searchQuery.trim() }),
      });

      if (!createResponse.ok) throw new Error('Failed to create panelist');

      const newPanelist = await createResponse.json();

      // 2. Add to all panelists list
      setAllPanelists([...allPanelists, newPanelist]);

      // 3. Add to program (pending or immediate)
      await handleAddPanelist(newPanelist);
      
      setSearchQuery('');
      setSuccess('Panelista creado y agregado correctamente');
    } catch (err) {
      console.error('Error creating panelist:', err);
      setError('Error al crear el panelista');
    } finally {
      setLoading(false);
    }
  };

  // Clear messages after 6 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const filteredPanelists = allPanelists.filter(
    (panelist) =>
      panelist.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedPanelists.some(p => p.id === panelist.id)
  );

  const hasPanelists = selectedPanelists.length > 0;

  return (
    <Box>
      {error && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}
      {success && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1 }}>
          <Typography variant="body2">{success}</Typography>
        </Box>
      )}

      <Accordion 
        expanded={expandedAccordion === 'panelists'} 
        onChange={(_, isExpanded) => setExpandedAccordion(isExpanded ? 'panelists' : false)}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon />
            <Typography variant="subtitle1">
              Panelistas {hasPanelists && `(${selectedPanelists.length})`}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {/* Search and Add/Create Panelist */}
          <Box sx={{ display: 'flex', gap: 1, width: '100%', mb: 2 }}>
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
              loading={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar o crear panelista"
                  fullWidth
                  sx={{ minWidth: 300 }}
                />
              )}
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
                disabled={!searchQuery.trim() || loading}
                startIcon={<AddIcon />}
                sx={{ minWidth: 140 }}
              >
                Crear y Agregar
              </Button>
            )}
          </Box>

          {/* Selected Panelists */}
          {hasPanelists ? (
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                Panelistas {!programId && '(se asociarán al guardar el programa)'}
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
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay panelistas asignados. Busca y agrega panelistas usando el campo de arriba.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

