## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.
## 2024-06-29 - Tooltips for Dynamic IconButtons

**Learning:** Tooltips for dynamic `IconButton` elements like Zap, minimize, or close buttons in a custom player are extremely valuable for usability, especially since these buttons often only use visual iconography without visible text. It's crucial to apply them accurately using conditional values to match the dynamic state changes (e.g. `'Abrir'` vs `'Cerrar'`).

**Action:** When creating custom players or controls with multiple interactive states, immediately pair icon-only `IconButton` elements with `<Tooltip>` wrappers whose text dynamically adapts to the current state.
