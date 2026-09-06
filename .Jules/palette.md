## 2025-02-18 - Missing ARIA Labels on Password Visibility Toggles
**Learning:** Found a recurring accessibility pattern in authentication and profile components where icon-only buttons for toggling password visibility (using Visibility/VisibilityOff icons) lacked `aria-label` attributes. This prevents screen readers from understanding the button's purpose and state.
**Action:** Always ensure that icon-only buttons, specifically those dealing with sensitive or functional inputs like password visibility, have dynamic `aria-label` attributes that reflect the action (e.g., 'Mostrar contraseña' vs 'Ocultar contraseña').
## 2024-01-01 - Initializing Palette Journal\n**Learning:** This repo frequently uses MUI components and uses Spanish for the interface.\n**Action:** Use Spanish for aria-labels to maintain consistency. e.g. 'Editar' instead of 'Edit'.
## 2026-08-18 - Tooltips en IconButtons y estados dinámicos
**Learning:** Los `IconButton` sin texto visible tenían `aria-label` pero ningún indicio visual para usuarios videntes. Además, varios `aria-label` estáticos ("Expandir o contraer") no reflejaban el estado real del control.
**Action:** Envolver todo `IconButton` icon-only en `<Tooltip title="..." arrow>` con el mismo texto que el `aria-label`, y usar valores condicionales en ambos cuando el botón tiene estados (abrir/cerrar, mostrar/ocultar, suscribir/desuscribir).
## 2026-08-18 - Tooltips sobre botones deshabilitados
**Learning:** MUI `Tooltip` no muestra nada cuando su hijo está `disabled`: el botón deshabilitado no emite eventos de puntero, así que el tooltip queda muerto justo cuando más se necesita explicar por qué no se puede clickear.
**Action:** Cuando el hijo puede estar `disabled`, envolverlo en un `<span>` intermedio que sí recibe los eventos. Si el botón estaba posicionado con `position: absolute`, mover el posicionamiento a un `Box` contenedor para que el `span` no rompa el layout.
