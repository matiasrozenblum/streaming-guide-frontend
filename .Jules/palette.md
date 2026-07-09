## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.
## 2026-07-09 - Adding Tooltips to IconButtons
**Learning:** Sighted users can struggle with icon-only buttons that lack contextual labels, while screen readers rely solely on `aria-label`. The `IconButton` component from Material-UI is widely used in the app without visual tooltips.
**Action:** When working on UI enhancements or adding new `IconButton` components, wrap them in a `<Tooltip>` component to ensure sighted users get the same context that `aria-label` provides for screen readers.
