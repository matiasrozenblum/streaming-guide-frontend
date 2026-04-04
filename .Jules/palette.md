## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.

## 2025-04-04 - Adding ARIA labels to MUI IconButton components
**Learning:** Found several Material UI `<IconButton>` components in the backoffice tables (e.g., categories page) missing `aria-label`s. This is an accessibility issue pattern across administrative interfaces where icon-only buttons like edit, delete, and reorder arrows are heavily used.
**Action:** When adding or modifying `<IconButton>` elements for common actions (edit, delete, move), always ensure an explicit `aria-label` in Spanish is provided so screen readers can interpret the action correctly.
