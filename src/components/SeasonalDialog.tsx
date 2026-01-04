import React from 'react'
import {
  Dialog,
  DialogContent,
  IconButton,
  useTheme,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface Props {
  open: boolean
  onClose: () => void
}

const SeasonalDialog: React.FC<Props> = ({ open, onClose }) => {
  const theme = useTheme()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 'fit-content',
          display: 'inline-block',
          p: '16px 24px',
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '16px',
          boxShadow: theme.shadows[4],
          m: 1,
          maxWidth: '90vw',
        },
      }}
      BackdropProps={{
        sx: { backgroundColor: 'rgba(0,0,0,0.4)' },
      }}
    >
      <IconButton
        onClick={onClose}
        size="small"
        aria-label="Cerrar"
        sx={{
          position: 'absolute',
          top: 1,
          right: 1,
          color: theme.palette.text.secondary,
          '&:hover': { color: theme.palette.text.primary },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <DialogContent sx={{ p: 0, pt: { xs: 1, sm: 1 } }}>
        <Typography
          variant="body2"
          component="div"
          sx={{
            textAlign: 'center',
            whiteSpace: 'normal',
            lineHeight: 1.4,
            fontSize: '0.95rem',
          }}
        >
          ¡Felices Fiestas!<br/>
          Durante la semana de fin de año,<br/>
          la programación será reducida.
        </Typography>
      </DialogContent>
    </Dialog>
  )
}

export default SeasonalDialog


