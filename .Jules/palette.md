## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.
## 2025-05-09 - Missing ARIA Labels on Icon Buttons
**Learning:** Found missing `aria-label`s on icon-only buttons (`IconButton`) across different components like `StreamersClient` and `WeeklyOverridesTable` where they are used for functional actions like subscribing, editing, or deleting.
**Action:** Always ensure all icon-only action buttons across the codebase have dynamic or static `aria-label` attributes in Spanish to accurately reflect the action to screen readers.
