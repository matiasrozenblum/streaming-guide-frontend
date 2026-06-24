'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Alert,
  Chip,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export interface ConflictInfo {
  channelId: number;
  channelName: string;
  programId: number;
  programName: string;
  scheduleId?: number;
  dayOfWeek: string;
  weekStartDate: string;
  currentStartTime: string;
  currentEndTime: string;
  suggestedAction: 'reschedule' | 'cancel';
  suggestedStartTime?: string;
  suggestedEndTime?: string;
  hasExistingOverride: boolean;
  existingOverrideId?: string;
}

export interface ConflictResolution {
  programId?: number;
  scheduleId?: number;
  channelId: number;
  dayOfWeek: string;
  weekStartDate: string;
  action: 'cancel' | 'reschedule' | 'keep';
  newStartTime?: string;
  newEndTime?: string;
}

interface Props {
  open: boolean;
  conflicts: ConflictInfo[];
  targetWeek: 'current' | 'next';
  linkedProgramName: string;
  linkedProgramNewStart?: string;
  linkedProgramNewEnd?: string;
  onClose: () => void;
  onSubmit: (resolutions: ConflictResolution[]) => void;
}

type ActionType = 'keep' | 'cancel' | 'reschedule';

interface ResolutionState {
  action: ActionType;
  newStartTime: string;
  newEndTime: string;
}

function conflictKey(c: ConflictInfo): string {
  return `${c.programId}_${c.scheduleId ?? 'prog'}_${c.dayOfWeek}`;
}

export default function ConflictResolutionDialog({
  open,
  conflicts,
  targetWeek,
  linkedProgramName,
  linkedProgramNewStart,
  linkedProgramNewEnd,
  onClose,
  onSubmit,
}: Props) {
  const [resolutions, setResolutions] = useState<Record<string, ResolutionState>>(() => {
    const initial: Record<string, ResolutionState> = {};
    conflicts.forEach((c) => {
      initial[conflictKey(c)] = {
        action: c.suggestedAction === 'cancel' ? 'cancel' : 'reschedule',
        newStartTime: c.suggestedStartTime ?? c.currentStartTime,
        newEndTime: c.suggestedEndTime ?? c.currentEndTime,
      };
    });
    return initial;
  });

  // Re-init when conflicts change
  React.useEffect(() => {
    const initial: Record<string, ResolutionState> = {};
    conflicts.forEach((c) => {
      initial[conflictKey(c)] = {
        action: c.suggestedAction === 'cancel' ? 'cancel' : 'reschedule',
        newStartTime: c.suggestedStartTime ?? c.currentStartTime,
        newEndTime: c.suggestedEndTime ?? c.currentEndTime,
      };
    });
    setResolutions(initial);
  }, [conflicts]);

  const setAction = (key: string, action: ActionType) => {
    setResolutions((prev) => ({ ...prev, [key]: { ...prev[key], action } }));
  };

  const setTime = (key: string, field: 'newStartTime' | 'newEndTime', value: string) => {
    setResolutions((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleSubmit = () => {
    const result: ConflictResolution[] = conflicts.map((c) => {
      const key = conflictKey(c);
      const res = resolutions[key];
      return {
        programId: c.programId,
        scheduleId: c.scheduleId,
        channelId: c.channelId,
        dayOfWeek: c.dayOfWeek,
        weekStartDate: c.weekStartDate,
        action: res?.action ?? 'keep',
        newStartTime: res?.action === 'reschedule' ? res.newStartTime : undefined,
        newEndTime: res?.action === 'reschedule' ? res.newEndTime : undefined,
      };
    });
    onSubmit(result);
  };

  // Group by channel
  const byChannel: Record<number, { name: string; conflicts: ConflictInfo[] }> = {};
  conflicts.forEach((c) => {
    if (!byChannel[c.channelId]) {
      byChannel[c.channelId] = { name: c.channelName, conflicts: [] };
    }
    byChannel[c.channelId].conflicts.push(c);
  });

  const weekLabel = targetWeek === 'current' ? 'esta semana' : 'la próxima semana';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="warning" />
        Conflictos detectados
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          {linkedProgramName}
          {linkedProgramNewStart && linkedProgramNewEnd
            ? ` fue reprogramado de ${linkedProgramNewStart} a ${linkedProgramNewEnd}`
            : ' fue modificado'}{' '}
          para {weekLabel}. Los programas a continuación se superponen con el nuevo horario.
          Elegí qué hacer con cada uno.
        </Alert>

        {Object.entries(byChannel).map(([channelIdStr, { name, conflicts: channelConflicts }]) => (
          <Box key={channelIdStr} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              {name}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {channelConflicts.map((c) => {
              const key = conflictKey(c);
              const res = resolutions[key];

              return (
                <Box
                  key={key}
                  sx={{
                    mb: 2,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography fontWeight="medium">{c.programName}</Typography>
                    <Chip
                      label={`${c.currentStartTime} – ${c.currentEndTime}`}
                      size="small"
                      variant="outlined"
                    />
                    {c.hasExistingOverride && (
                      <Chip label="ya tiene override" size="small" color="warning" />
                    )}
                  </Box>

                  <ToggleButtonGroup
                    value={res?.action ?? 'keep'}
                    exclusive
                    onChange={(_, val) => val && setAction(key, val as ActionType)}
                    size="small"
                    sx={{ mb: 1 }}
                  >
                    <ToggleButton value="keep">Dejar como está</ToggleButton>
                    <ToggleButton value="reschedule">Ajustar horario</ToggleButton>
                    <ToggleButton value="cancel">Cancelar</ToggleButton>
                  </ToggleButtonGroup>

                  {res?.action === 'reschedule' && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <TextField
                        label="Nuevo inicio"
                        type="time"
                        value={res.newStartTime}
                        onChange={(e) => setTime(key, 'newStartTime', e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label="Nuevo fin"
                        type="time"
                        value={res.newEndTime}
                        onChange={(e) => setTime(key, 'newEndTime', e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Omitir todo</Button>
        <Button onClick={handleSubmit} variant="contained">
          Aplicar resoluciones
        </Button>
      </DialogActions>
    </Dialog>
  );
}
