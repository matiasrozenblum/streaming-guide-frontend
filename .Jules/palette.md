## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.

## 2026-08-25 - Tooltips for Global Player Controls
**Learning:** Sighted users may lack context for icon-only buttons in floating or global components like the YouTubeGlobalPlayer, even if aria-labels are present for screen readers.
**Action:** Always wrap icon-only buttons in floating or global controls with `<Tooltip>` components to provide on-hover context for sighted users, complementing the `aria-label`.
