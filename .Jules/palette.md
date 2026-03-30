## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.

## 2025-03-30 - Missing ARIA Labels on Floating Action Buttons (FABs)
**Learning:** Found an accessibility issue where Floating Action Buttons (`Fab` component from MUI) containing text and icons didn't have explicit `aria-label` attributes for clear screen reader context, relying purely on the internal text (e.g., "En vivo" for scrolling to current time in a schedule grid).
**Action:** While visible text is present, adding an explicit and descriptive `aria-label` (like "Ir al horario en vivo") improves the experience for screen reader users by explicitly defining the button's action.
