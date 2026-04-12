## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.

## 2024-05-18 - Visual Loading Indicators in Form Submissions
**Learning:** Adding explicit visual feedback (like a loading spinner inline within the primary button) during async operations like form submissions significantly improves user experience. It provides immediate acknowledgement of the user's action and sets expectations while reducing perceived wait time.
**Action:** When building forms in this project, consistently use `<CircularProgress size={24} color="inherit" />` inline within `<Button>` components to visually indicate `isLoading` states for a better UX experience.
