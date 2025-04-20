"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { ConfigService } from '@/services/config';

type Config = {
  key: string;
  value: string;
};

const ConfigPage = () => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [newConfig, setNewConfig] = useState<Config>({ key: '', value: '' });
  const [editConfig, setEditConfig] = useState<{ key: string; value: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{ key: string; oldValue: string; newValue: string } | null>(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      const data = await ConfigService.findAll();
      setConfigs(data);
    };
    fetchConfigs();
  }, []);

  const handleAddConfig = async () => {
    await ConfigService.set(newConfig.key, newConfig.value);
    setConfigs([...configs, newConfig]);
    setNewConfig({ key: '', value: '' });
  };

  const handleDeleteConfig = async (key: string) => {
    await ConfigService.delete(key);
    setConfigs(configs.filter(config => config.key !== key));
  };

  const handleUpdateConfig = async () => {
    if (dialogConfig) {
      await ConfigService.update(dialogConfig.key, dialogConfig.newValue);
      setConfigs(configs.map(config => (config.key === dialogConfig.key ? { ...config, value: dialogConfig.newValue } : config)));
      setDialogOpen(false);
      setDialogConfig(null);
    }
  };

  const handleValueChange = (key: string, newValue: string) => {
    setEditConfig({ key, value: newValue });
  };

  const handleSaveClick = (key: string, oldValue: string, newValue: string) => {
    setDialogConfig({ key, oldValue, newValue });
    setDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manage Configurations
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configs.map((config) => (
              <TableRow key={config.key}>
                <TableCell>{config.key}</TableCell>
                <TableCell>
                  <TextField
                    value={editConfig?.key === config.key ? editConfig.value : config.value}
                    onChange={(e) => handleValueChange(config.key, e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleDeleteConfig(config.key)}>
                    <Delete />
                  </IconButton>
                  {editConfig?.key === config.key && editConfig.value !== config.value && (
                    <Button
                      variant="contained"
                      onClick={() => handleSaveClick(config.key, config.value, editConfig.value)}
                    >
                      Save
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Key"
          value={newConfig.key}
          onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
          sx={{
            '& .MuiInputBase-input': {
              color: 'black',
            },
            '& .MuiInputLabel-root': {
              color: 'gray',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: 'black',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'gray',
              },
              '&:hover fieldset': {
                borderColor: 'black',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'black',
              },
            },
          }}
        />
        <TextField
          label="Value"
          value={newConfig.value}
          onChange={(e) => setNewConfig({ ...newConfig, value: e.target.value })}
          sx={{
            '& .MuiInputBase-input': {
              color: 'black',
            },
            '& .MuiInputLabel-root': {
              color: 'gray',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: 'black',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'gray',
              },
              '&:hover fieldset': {
                borderColor: 'black',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'black',
              },
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleAddConfig}
          disabled={!newConfig.key || !newConfig.value}
        >
          Add Config
        </Button>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <Typography>
            Estás seguro de que querés actualizar la config?
          </Typography>
          <Typography>
            {dialogConfig?.key} {dialogConfig?.oldValue} &gt; {dialogConfig?.newValue}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateConfig} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfigPage; 