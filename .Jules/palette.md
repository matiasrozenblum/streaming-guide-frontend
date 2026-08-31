## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.
## 2026-08-31 - ZappingTooltip Close Button Accessibility
**Learning:** Icon-only buttons used for closing tooltips or modals often lack proper ARIA labels and tooltips, making them inaccessible to screen readers and less intuitive for sighted users.
**Action:** Always add an explicit `aria-label` (in Spanish, reflecting the action, e.g., 'Cerrar') to  components and wrap them in a `<Tooltip>` when they don't have accompanying text.
## 2026-08-31 - ZappingTooltip Close Button Accessibility
**Learning:** Icon-only buttons used for closing tooltips or modals often lack proper ARIA labels and tooltips, making them inaccessible to screen readers and less intuitive for sighted users.
**Action:** Always add an explicit `aria-label` (in Spanish, reflecting the action, e.g., 'Cerrar') to IconButton components and wrap them in a `<Tooltip>` when they don't have accompanying text.
