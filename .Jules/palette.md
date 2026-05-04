## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.

## 2024-05-18 - Tooltips and ARIA Labels on Material UI IconButtons
**Learning:** Found instances in the backoffice tables (e.g., `programs/page.tsx`) where icon-only `IconButton` elements lacked `aria-label` attributes and tooltip hints, hindering both screen reader accessibility and visual clarity for sighted users.
**Action:** When implementing tables or lists with action columns, ensure every icon-only `IconButton` is wrapped in a `<Tooltip>` with a descriptive `title` and directly receives an `aria-label` in Spanish reflecting its action (e.g., 'Editar programa').
