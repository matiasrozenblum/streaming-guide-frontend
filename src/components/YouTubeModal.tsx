import React from 'react';
import { Dialog, DialogContent } from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  videoId: string;
}

export default function YouTubeModal({ open, onClose, videoId }: Props) {
  // Check if it's a channel live URL
  const isChannelLive = videoId.includes('@');
  
  const channelId = isChannelLive ? videoId.split('@')[1].split('/')[0] : videoId;
  
  const embedUrl = isChannelLive 
    ? `https://www.youtube.com/embed?channel=${channelId}`
    : `https://www.youtube.com/embed/${videoId}?autoplay=1`;

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
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </DialogContent>
    </Dialog>
  );
} 
