## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.

## 2025-02-18 - Missing ARIA labels on Multi-Step Navigation Buttons
**Learning:** Found a recurring accessibility pattern in multi-step authentication flows where the "Volver" (Back) buttons were missing `aria-label` attributes. While the button text "Volver" is present, an explicit `aria-label="Volver al paso anterior"` provides clearer context for screen reader users navigating complex, stateful multi-step forms.
**Action:** When implementing wizard-like or multi-step flows, ensure that secondary navigation buttons like "Back" or "Previous" have explicit `aria-label` attributes detailing their specific context.
