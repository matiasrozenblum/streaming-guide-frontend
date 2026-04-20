## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.
## 2026-04-20 - Improve Icon-only Buttons UX
**Learning:** Sighted users also benefit from clear descriptions of icon-only action buttons. Wrapping `IconButton` with `Tooltip` provides a hover label, complementing the screen-reader-focused `aria-label`.
**Action:** Always wrap `IconButton` in a `<Tooltip title="...">` element to provide a hover description, in addition to assigning the `aria-label` attribute.
