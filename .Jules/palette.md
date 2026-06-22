## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.

## 2024-05-24 - Tooltips for Icon Buttons
**Learning:** Found several `IconButton` components missing tooltips across the app. `IconButton` components already have `aria-label` attributes (e.g. in `YouTubeGlobalPlayer.tsx`), which is great for screen readers, but sighted users need tooltips to understand icon-only actions.
**Action:** When adding or reviewing icon-only buttons, wrap them in `<Tooltip title="..." arrow placement="top">` to ensure usability for sighted users. The tooltip text should generally match the `aria-label` text.
