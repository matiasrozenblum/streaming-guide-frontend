## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.
## 2024-03-05 - Missing ARIA Labels on Tooltip Close Buttons
**Learning:** Found an accessibility pattern where custom tooltip or dialog close buttons (like in `ZappingTooltip.tsx`) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose to dismiss the element.
**Action:** Always ensure that icon-only buttons, especially those acting as close or dismiss actions, have explicit `aria-label` attributes (e.g., 'Cerrar tooltip') to accurately reflect their function to screen readers.
