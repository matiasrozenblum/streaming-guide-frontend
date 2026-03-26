## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.

## 2025-02-18 - Missing ARIA Labels on Data Table Action Buttons
**Learning:** Found a recurring accessibility pattern in backoffice data tables (like Users and Panelists) where icon-only action buttons (Edit, Delete, Group, NavigateNext, NavigateBefore) lacked `aria-label` attributes. This prevents screen readers from understanding the action associated with each row or pagination control.
**Action:** Always ensure that icon-only buttons used in data tables for row-level actions or pagination have descriptive, localized `aria-label` attributes (e.g., 'Editar usuario', 'Eliminar panelista', 'Página siguiente') so screen reader users can interact with the tables effectively.
