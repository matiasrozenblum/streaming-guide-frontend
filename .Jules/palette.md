## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.
## 2024-05-18 - Missing ARIA Labels on secondary navigation flows like "Volver"
**Learning:** For multi-step or wizard-like navigation flows (such as authentication steps), secondary navigation buttons (e.g., "Volver") lack context-rich `aria-label` attributes in Spanish to improve accessibility for screen readers.
**Action:** Always ensure secondary navigation buttons (e.g., "Volver") include context-rich `aria-label` attributes in Spanish (e.g., "Volver al paso anterior") to improve accessibility for screen readers.
