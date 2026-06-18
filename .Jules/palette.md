## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.
## 2025-02-18 - Added Tooltips to IconButtons
**Learning:** Icon-only buttons lacking a visible label can be confusing for sighted users, even if they have an `aria-label` for screen readers. Using Material UI Tooltips around these buttons bridges the gap, offering clear visual feedback while keeping the interface clean.
**Action:** Always wrap `IconButton` components that do not have adjacent text labels with a `<Tooltip>` component to ensure both accessibility and good user experience.
