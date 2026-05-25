## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.

## 2024-05-27 - Tooltips for Icon-only states
**Learning:** Adding dynamic Tooltips to icon-only toggles (like eye/eye-off for password visibility) improves accessibility for sighted users who might not immediately intuit the icon meaning, complementing the ARIA labels used for screen readers. Using the `arrow` prop in MUI adds polish.
**Action:** When creating or updating functional icon toggles, wrap the IconButton in a `<Tooltip>` with a title matching the ARIA label's dynamic text.
