## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.

## 2024-05-03 - Accessible Tooltips for Disabled Buttons
**Learning:** In Material UI, when `IconButton` components are disabled, standard tooltips (`<Tooltip>`) do not trigger because pointer events are disabled on the button itself. Screen readers and mouse users both miss out on contextual info (like why it's disabled or what the button does).
**Action:** Wrap disabled `IconButton` components inside a `<span>` element within the `<Tooltip>` to restore the tooltip's hover and focus states, improving accessibility for all users. Also ensure `IconButton` elements have state-dependent `aria-label`s to dynamically communicate the action (e.g., "Suscribirse" vs "Desuscribirse").
