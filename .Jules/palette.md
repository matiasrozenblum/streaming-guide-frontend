## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.

## 2024-03-24 - Loading states for Material UI Buttons
**Learning:** Found an interaction pattern where async operations lacked clear loading states in forms (e.g. auth steps). Simply changing button text to "Enviando..." doesn't offer as strong of a visual cue to users as a spinner.
**Action:** When working with `<Button>` components in this project that have an `isLoading` prop, always consistently use `<CircularProgress size={24} color="inherit" />` inline as the `startIcon` to visually indicate loading states for a better UX experience.
