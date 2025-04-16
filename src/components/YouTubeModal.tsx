import React from 'react';
import { Dialog, DialogContent } from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  videoId: string;
}

export default function YouTubeModal({ open, onClose, videoId }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogContent sx={{ p: 0, '&.MuiDialogContent-root': { padding: 0 } }}>
        <iframe
          width="100%"
          height="500"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </DialogContent>
    </Dialog>
  );
} 