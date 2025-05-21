# Sistema de Diseño

Este sistema de diseño proporciona una base consistente para la interfaz de usuario de Streaming Guide. Está construido sobre Material-UI y Tailwind CSS, proporcionando componentes y tokens reutilizables.

## Estructura

```
src/design-system/
├── tokens.ts         # Variables de diseño (espaciado, tipografía, etc.)
├── components.tsx    # Componentes base reutilizables
└── README.md        # Esta documentación
```

## Tokens

Los tokens son las variables fundamentales que definen nuestro sistema de diseño. Incluyen:

- Espaciado
- Tipografía
- Bordes
- Sombras
- Transiciones
- Z-index

### Uso de Tokens

```typescript
import { tokens } from '@/design-system/tokens';

// Ejemplo de uso
const styles = {
  padding: tokens.spacing.md,
  fontSize: tokens.typography.fontSize.lg,
  borderRadius: tokens.borderRadius.md,
};
```

## Componentes Base

Proporcionamos componentes base que implementan nuestro sistema de diseño:

- `Container`: Contenedor base con padding y sombra
- `Title`: Título principal
- `Subtitle`: Subtítulo
- `Text`: Texto base
- `BaseButton`: Botón base con estilos consistentes
- `Card`: Componente de tarjeta
- `Section`: Sección de contenido
- `Input`: Campo de entrada
- `Badge`: Etiqueta o insignia

### Uso de Componentes

```typescript
import { Title, Text, BaseButton } from '@/design-system/components';

function MyComponent() {
  return (
    <div>
      <Title>Mi Título</Title>
      <Text>Contenido del componente</Text>
      <BaseButton>Click me</BaseButton>
    </div>
  );
}
```

## Guías de Estilo

### Espaciado

Usar siempre los tokens de espaciado definidos en lugar de valores hardcodeados:

```typescript
// ❌ Incorrecto
padding: '17px'

// ✅ Correcto
padding: tokens.spacing.md
```

### Tipografía

Mantener consistencia en la jerarquía tipográfica:

- Títulos: `Title` component
- Subtítulos: `Subtitle` component
- Texto regular: `Text` component

### Colores

Usar el sistema de colores de Material-UI a través del tema:

```typescript
const styles = {
  color: theme.palette.primary.main,
  backgroundColor: theme.palette.background.paper,
};
```

### Responsive Design

Usar los breakpoints de Material-UI:

```typescript
const styles = {
  padding: {
    xs: tokens.spacing.sm,
    sm: tokens.spacing.md,
    md: tokens.spacing.lg,
  },
};
```

## Mejores Prácticas

1. **Consistencia**: Usar siempre los componentes y tokens del sistema de diseño
2. **Responsive**: Diseñar para todos los breakpoints
3. **Accesibilidad**: Mantener contraste y tamaños de texto accesibles
4. **Performance**: Evitar estilos inline y preferir componentes estilizados
5. **Mantenibilidad**: Documentar variantes y props de componentes

## Contribución

Al agregar nuevos componentes o modificar los existentes:

1. Mantener la consistencia con el sistema existente
2. Documentar cambios y adiciones
3. Proporcionar ejemplos de uso
4. Considerar la accesibilidad
5. Asegurar compatibilidad responsive 