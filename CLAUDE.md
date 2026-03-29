# La Guia del Streaming - Frontend (Web)

## Project Overview
Next.js website showing a TV-style streaming schedule grid.
Desktop and mobile responsive. The mobile layout is the design reference for the native app.

## Tech Stack
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Material-UI (MUI) 7, Tailwind CSS 4, Emotion
- **Auth**: NextAuth 4 with JWT
- **HTTP**: Axios
- **Analytics**: PostHog, Vercel Analytics, Microsoft Clarity
- **Dates**: dayjs
- **Animation**: Framer Motion

## Design Tokens
- **Dark**: bg `#0f172a`, paper `#1e293b`, primary `#3b82f6`, text `#f1f5f9`, textSecondary `#cbd5e1`
- **Light**: bg `#f8fafc`, paper `#ffffff`, primary `#2563eb`, text `#111827`, textSecondary `#4B5563`
- **Status**: live `#F44336`, offline `#6B7280`
- **Fonts**: Inter/Roboto (body), Outfit (headings)
- **Border**: `#334155` (dark), `#e2e8f0` (light)

## Coding Conventions
- App Router: pages in `src/app/`, server components by default, `'use client'` only when needed
- Path alias: `@/*` maps to `./src/*`
- MUI components with theme customization (no inline color literals - use theme tokens)
- Responsive: mobile-first, breakpoints via MUI `useMediaQuery` or Tailwind
- API calls through service layer in `src/services/`

## Key Paths
- `src/app/` - App Router pages and layouts
- `src/components/` - Shared UI components
- `src/theme/` - MUI theme (dark + light)
- `src/services/` - API service layer (Axios)
- `src/contexts/` - React context providers
- `src/hooks/` - Custom hooks
- `src/design-system/` - Design system primitives

## Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - ESLint

## Cross-Repo Context
- Backend: `streaming-guide-backend` (NestJS on Railway)
- Mobile: `streaming-guide-mobile` (should match this site's mobile viewport)
- Changes to components visible on mobile viewport may need replication in the native app
