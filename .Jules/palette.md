## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.

## 2024-05-18 - Missing Tooltips and aria-labels on IconButton in Backoffice Tables
**Learning:** Found a widespread a11y issue where icon-only components (`IconButton`) in Material UI backoffice tables (like the programs table) lack `aria-label`s and `Tooltip` components, preventing proper screen-reader announcements and sighted user context. This matches the rule that icon-only buttons must have an explicit `aria-label` attribute in Spanish and be wrapped in a `<Tooltip>`.
**Action:** Always wrap `<IconButton>` in `<Tooltip title="...">` and provide an explicit `aria-label` in Spanish mirroring the tooltip text when building or modifying backoffice tables in this app.
