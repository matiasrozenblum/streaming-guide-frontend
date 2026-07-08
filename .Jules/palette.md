## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.

## 2024-05-18 - Auth Flow Navigation Accessibility
**Learning:** Found a recurring pattern in the authentication flow where secondary navigation buttons (like "Volver" / Back) lacked context for screen readers. A simple "Volver" button on a wizard step doesn't tell a non-sighted user what they are returning to.
**Action:** Added `aria-label="Volver al paso anterior"` to these buttons across all auth steps (`CodeStep`, `ExistingUserStep`, `PasswordStep`, `ProfileStep`). When working on multi-step flows, always ensure navigation buttons have context-rich labels.
