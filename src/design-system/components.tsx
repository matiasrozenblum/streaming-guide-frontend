import { Box, Button, Typography, styled } from '@mui/material';
import { tokens } from './tokens';

// Componente base para contenedores
export const Container = styled(Box)(({ theme }) => ({
  padding: tokens.spacing.md,
  borderRadius: tokens.borderRadius.md,
  backgroundColor: theme.palette.background.paper,
  boxShadow: tokens.boxShadow.sm,
}));

// Componente base para títulos
export const Title = styled(Typography)(({ theme }) => ({
  fontFamily: tokens.typography.fontFamily.primary,
  fontWeight: tokens.typography.fontWeight.bold,
  color: theme.palette.text.primary,
  marginBottom: tokens.spacing.md,
}));

// Componente base para subtítulos
export const Subtitle = styled(Typography)(({ theme }) => ({
  fontFamily: tokens.typography.fontFamily.primary,
  fontWeight: tokens.typography.fontWeight.medium,
  color: theme.palette.text.secondary,
  marginBottom: tokens.spacing.sm,
}));

// Componente base para texto
export const Text = styled(Typography)(({ theme }) => ({
  fontFamily: tokens.typography.fontFamily.primary,
  fontWeight: tokens.typography.fontWeight.regular,
  color: theme.palette.text.primary,
  lineHeight: tokens.typography.lineHeight.normal,
}));

// Componente base para botones
export const BaseButton = styled(Button)(() => ({
  fontFamily: tokens.typography.fontFamily.primary,
  fontWeight: tokens.typography.fontWeight.medium,
  padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
  borderRadius: tokens.borderRadius.md,
  transition: `all ${tokens.transition.normal} ${tokens.transition.timing}`,
  textTransform: 'none',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: tokens.boxShadow.md,
  },
}));

// Componente base para cards
export const Card = styled(Box)(({ theme }) => ({
  padding: tokens.spacing.lg,
  borderRadius: tokens.borderRadius.lg,
  backgroundColor: theme.palette.background.paper,
  boxShadow: tokens.boxShadow.sm,
  transition: `all ${tokens.transition.normal} ${tokens.transition.timing}`,
  '&:hover': {
    boxShadow: tokens.boxShadow.md,
  },
}));

// Componente base para secciones
export const Section = styled(Box)(({ theme }) => ({
  padding: tokens.spacing.xl,
  marginBottom: tokens.spacing.xl,
  backgroundColor: theme.palette.background.default,
  borderRadius: tokens.borderRadius.lg,
}));

// Componente base para inputs
export const Input = styled('input')(({ theme }) => ({
  width: '100%',
  padding: tokens.spacing.sm,
  borderRadius: tokens.borderRadius.md,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  fontFamily: tokens.typography.fontFamily.primary,
  fontSize: tokens.typography.fontSize.md,
  transition: `all ${tokens.transition.normal} ${tokens.transition.timing}`,
  '&:focus': {
    outline: 'none',
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
  },
}));

// Componente base para badges
export const Badge = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
  borderRadius: tokens.borderRadius.full,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontSize: tokens.typography.fontSize.xs,
  fontWeight: tokens.typography.fontWeight.medium,
})); 