# Changelog

Todas las modificaciones importantes de este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/)
y este proyecto utiliza [SemVer](https://semver.org/lang/es/).


## [1.26.0] - 2026-06-23

### Added

- **Creación de programas en múltiples canales**: el selector de canal en el formulario de nuevo programa es ahora un `Autocomplete` multi-select. Con 2+ canales seleccionados se llama a `POST /api/programs/bulk` y se crean N programas independientes en una sola acción.
- **Creación de programas especiales en múltiples canales**: el selector de canal en el tab "Programas Especiales" también es multi-select; con 2+ canales se llama a `POST /api/weekly-overrides/bulk`.
- **Borrado masivo de programas**: la columna "Logo" (sin uso) fue reemplazada por una columna de checkbox. Al seleccionar ≥1 programa aparece una barra flotante con la opción de eliminar, con diálogo de confirmación que lista `nombre — canal` de cada programa.
- **Borrado masivo de cambios semanales**: misma mecánica de checkbox + barra flotante + diálogo de confirmación en los tabs "Semana Actual", "Próxima Semana" y "Programas Especiales". La selección se limpia automáticamente al cambiar de tab.
- **Programas linkeados — UI de backoffice**: ícono de vínculo en la tabla de programas cuando un programa tiene `link_group_id`. Diálogo de confirmación de borrado advierte que eliminar un programa linkeado no afecta al resto del grupo.
- **Diálogo de resolución de conflictos** (`ConflictResolutionDialog`): tras crear o editar un weekly override, si el backend detecta solapamientos en la grilla se muestra automáticamente un diálogo que lista cada conflicto agrupado por canal, con sugerencia automática de acción (ajustar horario o cancelar) y pickers de tiempo editables. Las resoluciones se envían a `POST /api/weekly-overrides/resolve-conflicts`.

### Fixed

- El tab "Programas Especiales" de weekly overrides ahora muestra el nombre del canal en vez del ID numérico para overrides de tipo `create`.
- **Banner web — scroll en dos fases**: el banner ahora se desplaza hacia arriba y desaparece completamente antes de que la grilla empiece a moverse, replicando el comportamiento de la app nativa. El offset del banner se actualiza mediante mutación directa del DOM (sin re-renders de React) para evitar fricción en el scroll.
- Fondo del área de over-scroll (bounce) ahora coincide con el color de fondo del tema (oscuro `#0f172a` / claro `#f8fafc`) en lugar de mostrar blanco.

## [1.24.0] - 2026-06-18

### Fixed
- Zapping panel on `/streamers` page was showing channels instead of streamers. `StreamersClient` now registers a live-streamers-only zap list (cleared on unmount), while `HomeClient` clears its channel list on unmount, so each page owns the zap list while active.
- Zapping panel and mobile cards now render streamer logos as square (44×44 / 48×48 with `objectFit: cover` and dark fallback background) instead of the rectangular channel logo dimensions.
- Player header mini-logo is now square (28×28) when showing a streamer, matching the zap panel style.
- `handleServiceClick` in `StreamersClient` now passes `channelInfo` (streamer id/name/logo) to `openStream`/`openVideo`, so the player header and current-item highlighting work correctly when opening from the streamers page.

---

## [1.23.1] - 2026-06-18

### Fixed
- Weekly override pill indicator ("¡Hoy!" / "¡Especial!") was showing only the first character (e.g. "e") because pill font size, padding and `maxWidth` were all computed from `blockWidth`, a DOM-measured `offsetWidth` that returned an incorrect (near-zero) value at mount time before layout resolved. Opening DevTools triggered a resize that re-measured correctly, confirming the root cause. Fixed by replacing `blockWidth` with `widthPx` (a pure calculation always available) throughout the pill sizing logic; also removed the now-dead `blockWidth` state and its `resize` listener.
- Weekly override dot vs. pill decision: condition included `totalMultipleStreams > 1` which forced the dot indicator even on wide blocks that shared a lane with another program. Replaced with `widthPx < 100` so the decision is based solely on the block's computed pixel width.

---

## [1.23.0] - 2026-06-18

### Added
- **Zapping between channels in the video player**: when the player is open and maximized, a toggle button (≡) reveals a side panel (desktop) or cards above/below (mobile) listing all currently-live channels. Clicking any channel zaps to it without closing the player.
  - Desktop: `ZapSidePanel` — fixed-position sidebar to the left of the player (200 px wide, slides in/out with a 280 ms transition). Shows all live channels in grid order; the currently-playing channel is highlighted with a blue border and bold text. Auto-scrolls to center the current channel on open.
  - Mobile: `ZapCard` — collapsible cards above/below the player showing up to 2 live channels from each direction. Animated with `max-height` transition.
  - New `ZapItem` type (`src/types/zap.ts`) and `parseStreamUrl` utility (`src/utils/parseStreamUrl.ts`) to detect YouTube / Twitch / Kick URLs.
  - `YouTubeGlobalPlayerContext` extended with `zapList`, `setZapList`, and `zapToChannel`.
  - `HomeClient` derives the zap list from `channelsWithSchedules` + `liveStatus` (live channels only; current channel always included).
  - Channel mini-logo and name shown in the player controls bar.

### Fixed
- Overflow zone: programs with `start_time = "00:00"` on the next day are no longer injected into the current day's overflow zone. They appeared flush against the right edge of cross-midnight blocks (which end at 24:00), creating a visual duplicate. These programs now only appear when viewing their own day. (`ScheduleGridDesktop`, `ScheduleGridMobile`)
- Overflow zone: added `positionOffset` to the React `Fragment` key in `ScheduleRow` (`scheduleId|programId|positionOffset`). The same schedule could appear as an overflow block (positionOffset=1440) on day X and as a current-day block (positionOffset=0) on day X+1 — React reused the component instance, causing the previous day's block color to persist via the `background-color` CSS transition.
- Double tooltip on same-program multiple slots: `tooltipId` in `ProgramBlock` was keyed by `program.id`, shared across all schedule entries for the same program. Hovering either slot opened both tooltips simultaneously. Fixed by including `start_time` in the ID (`program-${id}-${start}`).

---

## [1.22.0] - 2026-06-14

### Added
- Backoffice programs page: live search by name or channel, sort selector (name A→Z / Z→A, channel A→Z, newest / oldest by id), schedule filter (all / with schedules / without schedules), and client-side pagination (10/25/50/100 per page).

---

## [1.21.0] - 2026-06-11

### Added
- Full-page skeleton loading screen (`HomePageSkeleton`) replaces the bare spinner shown during initial hydration. Matches the site layout: header bar, banner, day-selector pills, category tabs, time header, and 8 channel rows with program block placeholders. Uses deterministic block positions to avoid SSR hydration mismatches.
- `src/app/loading.tsx`: Next.js streaming fallback — on cold starts the skeleton is sent to the browser immediately while `page.tsx` awaits backend data, eliminating the blank-tab experience.
- `src/app/global-error.tsx`: standalone error page (provides its own `<html>`/`<body>`) for cases where the root layout itself fails (e.g. broken deploy). Embeds Inter font and all styles inline; uses `prefers-color-scheme` for dark mode since the layout's ThemeProvider is unavailable.

### Fixed
- Error page (`src/app/error.tsx`) rewritten with MUI components to match the site's design system (gradient background, Inter typography, themed buttons). Previous Tailwind-based version rendered unstyled because Tailwind's PostCSS pipeline does not compile classes for Next.js special-route files in this project's setup.
- `ThemeContext` loading state: replaced `<CircularProgress />` with `<HomePageSkeleton />` wrapped in `MuiThemeProvider`, so the brief hydration phase renders a recognizable layout instead of a blank spinner.

---

## [1.20.0] - 2026-06-10

### Added
- Timezone adaptation: schedule grid now displays program times in the user's local timezone
- `src/utils/timezone.ts` with `localizeSchedule`, `getLocalToARTOffsetMinutes` utilities
- Day-of-week shift handling: programs that cross local midnight appear on the correct local day
- Overflow zone correctly populated for non-Argentina timezones (fixed source selection)
- `is_premiere?: boolean` field in `Program` type with checkbox "Es estreno" in backoffice programs form (create/edit)
- `is_premiere?: boolean` in `WeeklyOverride.specialProgram` type with checkbox "Es estreno" in weekly overrides form for Programas Especiales
- "Buscar estreno en vivo" action button (`PlayCircleOutlined`) in backoffice channels table
- `POST /api/channels/[id]/fetch-premiere` Next.js proxy route

### Changed
- `ScheduleGridDesktop` and `ScheduleGridMobile` apply ART→local conversion before filtering
- `NowIndicator` and scroll-to-now always reference local time (no change for Argentina users)
- `splitLongProgram` fixed for cross-midnight programs: block boundaries now computed with absolute minutes to avoid visual overlaps

### Fixed
- 24/7 programs (`00:00–23:59`) skipped from timezone conversion — shown as full-day in all timezones to avoid the gap caused by day-shift
- Overflow zone for non-Argentina users used `nextWeekMondaySchedules` instead of `localizedSchedules`, causing empty overflow on timezone-shifted Sundays

---

## [1.19.2] - 2026-06-06

### Fixed
- Bloques fantasma al cambiar de día: se corrige la key de `React.Fragment` en `ScheduleRow` usando `scheduleId|programId` en lugar de solo `programId`. El mismo programa puede aparecer dos veces en la lista de un día (como bloque regular y como overflow inyectado del día siguiente), lo que causaba colisión de keys y que React dejara bloques del día anterior visibles al navegar entre días

---

## [1.19.1] - 2026-06-03

### Added
- Indicador "día siguiente" en inputs de hora de fin del backoffice cuando el horario cruza medianoche: chip flotante sobre el campo (reemplaza el helperText anterior)

### Fixed
- Separador de medianoche en la zona de overflow: se elimina la línea punteada vertical, el límite ahora se indica únicamente con el cambio de fondo (alineado con el estilo de la app mobile)
- Programas cross-midnight (ej: 23:00–00:30) ahora muestran correctamente el badge LIVE: se corrige la prioridad entre el valor estático del load inicial y el valor actualizado por el poller, y se agrega detección client-side de ventana horaria cross-midnight como fallback ante el bug de cálculo en el backend

---

## [1.19.0] - 2026-05-31

### Added
- Day overflow zone: cada columna de día extiende 4 horas pasada la medianoche (00:00–03:59), mostrando programas que cruzan la medianoche como un bloque continuo en lugar de divididos en dos días
- El domingo muestra los programas del próximo lunes en la zona de overflow, incluyendo cambios semanales (cancelaciones, horarios alterados, programas especiales) aplicados en tiempo real
- Zona de overflow con fondo diferenciado y borde punteado en el límite de medianoche (00:00)
- Actualización en tiempo real vía SSE: el overflow del domingo reacciona a overrides del lunes siguiente sin recargar la página

### Fixed
- Programas que cruzan medianoche (ej: 23:00–01:00) ahora se renderizan como un único bloque continuo
- Programas con el mismo `program.id` en días consecutivos (inyección de overflow) ahora tienen lane assignments independientes, evitando renderizado a media altura
- El guard de out-of-bounds se ejecuta después de todos los hooks (corrección de rules-of-hooks)
- La columna de canal sticky y el TimeHeader ya no se rompen por el contenido de overflow

## [1.18.3] - 2026-05-30

### Fixed
- Banner create/update/delete no longer invalidates the full Next.js Data Cache for the home page. The banners fetch now uses cache tag `banners`, and `/api/revalidate` supports tag-based revalidation. Previously, any banner change triggered `revalidatePath('/')` which busted all server-side caches (including the heavy week-schedules endpoint), causing a Vercel 15-second timeout loop that could take 15–20 minutes to recover from.

---

## [1.19.0] - 2026-05-31

### Added
- Day overflow zone: cada columna de día extiende 4 horas pasada la medianoche (00:00–03:59), mostrando programas que cruzan la medianoche como un bloque continuo en lugar de divididos en dos días
- El domingo muestra los programas del próximo lunes en la zona de overflow, incluyendo cambios semanales (cancelaciones, horarios alterados, programas especiales) aplicados en tiempo real
- Zona de overflow con fondo diferenciado y borde punteado en el límite de medianoche (00:00)
- Actualización en tiempo real vía SSE: el overflow del domingo reacciona a overrides del lunes siguiente sin recargar la página

### Fixed
- Programas que cruzan medianoche (ej: 23:00–01:00) ahora se renderizan como un único bloque continuo
- Programas con el mismo `program.id` en días consecutivos (inyección de overflow) ahora tienen lane assignments independientes, evitando renderizado a media altura
- El guard de out-of-bounds se ejecuta después de todos los hooks (corrección de rules-of-hooks)
- La columna de canal sticky y el TimeHeader ya no se rompen por el contenido de overflow

---

## [1.18.2] - 2026-05-26

### Added
- `robots.txt`: disallow indexing of `/backoffice/`, `/api/`, `/profile` and `/subscriptions`
- `sitemap.xml`: homepage (hourly), streamers (daily), legal pages (monthly)

---

## [1.18.1] - 2026-05-25

### Added
- Tooltips and ARIA labels to all backoffice icon buttons (programs, channels, streamers, banners, WeeklyOverridesTable, ManageDevicesDialog, hamburger menu)
- Tooltips on password visibility toggles in login/register steps
- Dynamic ARIA label on streamer subscription toggle

### Fixed
- Program blocks of 30 minutes or less no longer show panelists, using the freed space to display the full title across up to 3 lines

---

## [1.18.0] - 2026-05-24

### Added
- Monthly schedule recurrence UI in backoffice (`SchedulesTable`): "Tipo de recurrencia" selector with three modes — Semanal, Mensual fijo, Mensual por fecha
- "Mensual fijo": shows week-of-month picker (1°–4°, Último) + day-of-week picker
- "Mensual por fecha": shows date picker + informational alert to load each date manually
- "Horarios Actuales" table: new Tipo chip column and unified Día / Fecha column supporting all three recurrence types
- Inline edit row in the schedule table supports switching and editing all three recurrence types
- Monthly schedule recurrence UI in "Editar Programa" dialog (`ProgramSchedulesSection`): same recurrence modes available when adding/editing schedules from the program edit flow
- TypeScript types updated: `schedule_type`, `week_number_in_month`, `specific_date` added to `Schedule` interface

### Fixed
- "Agregar Horario" button no longer overflows the dialog on narrow screens (moved to its own full-width row below the time fields), in both `SchedulesTable` and `ProgramSchedulesSection`
- Banner hide/show infinite loop in categories with few channels (e.g. Deporte): banner now only hides on scroll if the content would still overflow after the banner is removed

---

## [1.17.0] - 2026-04-16

### Added
- Add channel logo image upload via Supabase in admin panel, with preview and manual URL fallback (feature/channel-logo-upload)

---

## [1.16.14] - 2026-04-13

### Changed
- Enable Datadog Session Replay at 20% sample rate (fix/analytics-channel-name-and-datadog-replay)

### Fixed
- Fix click_youtube_live analytics events sending undefined channel_name (shown as "unknown" in PostHog breakdowns); make channelName required in ProgramBlock and add explicit fallback (fix/analytics-channel-name-and-datadog-replay)
- Hide panelists in ProgramBlock when multiple programs run simultaneously to prioritize title space in reduced-height blocks (fix/hide-panelists-on-simultaneous-programs)

---

## [1.16.13] - 2026-04-13

### Changed
- Switch Datadog RUM to opt-out model: initialize for all non-admin users and only skip events on explicit analytics rejection, matching PostHog coverage (enhancement/datadog-opt-out-model)

## [1.16.12] - 2026-04-12

### Added
- Add loading spinners (CircularProgress) to auth submit buttons with accessible aria-labels during loading state (enhancement/jules-prs-consolidation)
- Add aria-labels to icon-only buttons across backoffice: configs delete, categories move/edit/delete, ProgramSchedulesSection accept/cancel/edit/delete/bulk-delete, IOSPushGuide expand/collapse, and mobile live schedule FAB (enhancement/jules-prs-consolidation)

---

## [1.16.11] - 2026-04-11

### Added
- Enable Datadog RUM native page view tracking (startView) and automatic resource/interaction/long-task tracking for visitors, sessions and bounce rate analytics (enhancement/datadog-rum-native-pageviews)

---

## [1.16.10] - 2026-04-11

### Added
- Datadog RUM integration to replicate all PostHog analytics events (pageviews + custom actions) with consent and admin-user gating (feature/datadog-rum-analytics)

---

## [1.16.9] - 2026-04-08

### Fixed
- Programas simultáneos: el indicador "¡Hoy!" ahora muestra el círculo naranja en lugar del pill completo
- Programas simultáneos: el título ahora se centra verticalmente en cada sub-bloque
- Programas simultáneos: cálculo corregido de cantidad máxima de programas simultáneos usando greedy lane assignment (evitaba dividir el row en demasiadas partes cuando un programa solapaba con distintos vecinos en momentos diferentes)
- Programas simultáneos: posicionamiento vertical corregido usando porcentajes en lugar de píxeles, garantizando que 2 o 3 bloques dividan la altura del row correctamente

---

## [1.16.8] - 2026-04-06

### Changed

### Fixed
- Botón "En vivo" lanzaba un error al hacer click cuando Microsoft Clarity aún no había cargado

## [1.16.7] - 2026-03-29

### Changed
- Show "Sin playlist disponible" in tooltip when channel has no stream URL

### Fixed
- Fixed YouTube iframe player freezing/blanking after ~3 minutes by removing `enablejsapi=1` from embed URL

## [1.16.6] - 2026-03-28

### Added
- Added tooltip and dynamic aria-label to notification bell in ProgramBlock
- Added focus-visible keyboard navigation styles to header buttons (ThemeToggle, UserButton, UserMenu)
- Added aria-labels to icon-only buttons across app: CookiePreferencesModal, ProfileCompletionForm, SubscriptionsClient
- Added aria-labels to backoffice data table action buttons: PanelistsTable, UsersTable, ManageSubscriptionsDialog, ProposedChangesTable, SchedulesTable, WeeklyOverridesTable

### Fixed
- Fixed TypeScript type error for `applicationServerKey` in PushContext
- Fixed `borderTopRadius` arithmetic type error in StreamersClient

## [1.16.5] - 2026-03-24

### Added
- Added admin non-tracking

## [1.16.4] - 2026-03-23

### Fixed
- Fixed bell icon not showing up for users without session on streamers
- Fixed bell icon triggering browser confirm message


## [1.16.3] - 2026-03-23

### Changed
- Unoptimized images in backoffice

## [1.16.2] - 2026-03-16

### Added
- Added aria-labels to buttons

### Fixed
- Fixed error page not showing up

## [1.16.1] - 2026-03-05

### Changed
- Now indicating which service the streamer is live on

## [1.16.0] - 2026-03-05

### Changed
- Major refactor to favorites section
- Major refactor to subscriptions, removing types, only push.

## [1.15.10] - 2026-01-31

### Added
- Added live streamer order and service filter for backoffice

## [1.15.9] - 2026-01-30

### Added
- Added manual sync for streamers live status

## [1.15.8] - 2026-01-30

### Added
- Added streamer click tracking 

## [1.15.7] - 2026-01-28

### Fixed
- Removed banner darkening

## [1.15.6] - 2026-01-21

### Added
- Added order for streamers

### Changed
- Made streamers and channels list draggable for reordering in backoffice

### Fixed
- Fixed SSE events being deleted when backoffice detected them and not updating frontend

## [1.15.5] - 2026-01-17

### Added
- Added offline badge for streamers to better differentiate from LIVE status

## [1.15.4] - 2026-01-17

### Changed
- Now we have two banner images, web and mobile
- Dual border color for streamers with multiple services

### Fixed
- Fixed service selector for streamers in backoffice

## [1.15.3] - 2026-01-14

### Added
- Added upload banner logic
- Added fixed banner logic


## [1.15.2] - 2025-12-31

### Added
- Added is_visible field for program entities
- Added delete all schedules button on schedule dialog

## [1.15.1] - 2025-12-24

### Added
- Added seasonal popup

### Fixed
- Upgraded next version

## [1.15.0] - 2025-12-03

### Added
- Added banner logic

### Changed
- Made footer part of the schedule grid, unifying scrolling logic

## [1.14.0] - 2025-11-25

### Added
- Added buttons to clear cache and modify youtube fetch configs from channel dialog

## [1.13.0] - 2025-11-23

### Added
- Added streamers section
- Streamers section, bottom navigation and margin conditioned by streamers config

## [1.12.4] - 2025-11-04

### Added
- Now we can CRUD programs within program dialog

## [1.12.3] - 2025-11-04

### Added
- Now we can CRUD schedules within program dialog

### Changed
- Now showing all titles in uppercase in the tooltips

## [1.12.2] - 2025-11-02

### Changed
- Now tooltip shows up where the cursor is located in X position

## [1.12.1] - 2025-10-28

### Added
- Added several new SSE events to listener

## [1.12.0] - 2025-10-08

### Added
- Now categories can be hidden and reordered individually
- Long programs are now split into smaller program blocks for improved visibility

### Fixed
- Fixed the frontend not listening SSE events from the backend

## [1.11.0] - 2025-10-06

### Added
- Added optimized API integration for lightning-fast schedule loading
- Added separate endpoints for today's schedules and full week schedules
- Added background loading strategy for improved user experience
- Added live status re-enablement with optimized backend support

### Changed
- Optimized initial page load by fetching today's schedules first
- Improved schedule loading performance with 99.9% faster response times
- Updated API calls to use new optimized endpoints (`/channels/with-schedules/today` and `/channels/with-schedules/week`)
- Enhanced user experience with immediate today's schedule display and background week loading
- Re-enabled live status functionality with optimized backend caching

### Fixed
- Fixed slow initial page load times
- Fixed live status polling performance issues
- Fixed schedule fetching bottlenecks

## [1.10.0] - 2025-10-04

### Added
- Added categories for channels

## [1.9.2] - 2025-10-02

### Fixed
- Fixed resend code button not doing anything

## [1.9.1] - 2025-09-29

### Added
- Added background color field and visibility on schedule toggle to channel dialog

### Changed
- Now getting channel background from the backend
- Filtering channel visibility with new field
- Updated backoffice header to add logo and user menu with links to other pages

## [1.9.0] - 2025-09-27

### Added
- Added support for multiple live streams in parallel for one channel
- Added Carnaval channel background

## [1.8.4] - 2025-08-25

### Fixed
- Now backoffice schedules section only reads from the DB

## [1.8.3] - 2025-08-23

### Changed
- Now special program pill text says "especial" if it's not today

## [1.8.2] - 2025-08-23

### Added
- Added stream_url (playlist) to special programs

## [1.8.1] - 2025-08-19

### Fixed
- Weekly override reschedule type update fixed

## [1.8.0] - 2025-08-19

### Added
- Now weelky overrides are modifiable

## [1.7.3] - 2025-08-12

### Fixed
- Made backoffice statistics section more resilient

## [1.7.2] - 2025-08-11

### Added
- Added reports by channel
- Added automatic weekly, monthly, quarterly and yearly reports

### Changed
- Backoffice reports section refactor

### Fixed
- Fixed several device save operations on sign up

## [1.7.1] - 2025-08-05

### Changed
- Now decoding JWT and setting session.expires to JWT token's exp value if decodable
- Adapted SW to check for token refresh when tab becomes active again
- Now session lasts 7 days instead of 15 minutes

### Fixed
- Fixed automatic session refresh

## [1.7.0] - 2025-08-03

### Changed
- Now users backoffice section has pagination

### Fixed
- Fixed session refresh bug
- Fixed gender charts not counting unknown

## [1.6.0] - 2025-07-29

### Added

- Added channel visibility toggle functionality in backoffice
- Added filtering to only show visible channels on frontend
- Added Switch component for channel visibility in create/edit dialogs

## [1.5.2] - 2025-07-29

### Removed
- Code cleanup in LoginModal component

### Fixed
- Fixed tracking for regular sign up, social sign up and social login

## [1.5.1] - 2025-07-29

### Changed
- Changed panelist select in weekly change to use the same as the regular program dialog
- Replaced stock date picker from login modal and profile completion form fur MUI date picker as in the statistics backoffice section
- Fixed normal sign up by removing password from profile step and not calling complete-profile

## [1.5.0] - 2025-07-26

### Added
- Added social sign up and login with google integration
- Added tracking for social sign up and login
- Added azz channel background color

## [1.4.0] - 2025-07-11

### Added
- Added Server-Sent Events (SSE) for real-time live status updates
- Added LiveStatusListener component to handle SSE connections
- Added smart polling that triggers immediate refreshes when programs go live
- Added on-demand revalidation system to update cached pages when backend data changes
- Added SSE broadcasting and revalidation webhook calls for program, panelist, channel, and schedule changes

## [1.3.3] - 2025-07-10

### Changed
- Applied several visual refactors to statistics backoffice section, again

## [1.3.2] - 2025-07-02

### Changed
- Applied several visual refactors to statistics backoffice section

## [1.3.1] - 2025-06-29

### Added
- Added reports logic

## [1.3.0] - 2025-06-22

### Added
- Added statistics backoffice section
- Added devices and subscriptions to users backoffice section

## [1.2.9] - 2025-06-21

### Added
- Added logic to bulk creat schedules
- Added logic to weekly override whole programs
- Added logic to add panelists to weekly overrides
- added statistics backoffice section for users and subscriptions


## [1.2.8] - 2025-06-20

### Changed
- Optimized session polling to reduce function invocations

## [1.2.7] - 2025-06-19

### Changed
- Changed boca and river style overrides (not being used currently)
- Optimized server side functions, now only fetching whole week server side and revalidate every 5 minutes instead of 1 minte

## [1.2.6] - 2025-06-18

### Added
- Added channel info to GA events
- Added style override logic for programs

## [1.2.5] - 2025-06-17

### Changed
- Now not reloading page on log in, log out or sign up completee.
- Cleaned channels and programs backoffice pages with buttons and channe logos.
- Added new program weekly override type and section

## [1.2.4] - 2025-06-16

### Changed
- Weekly change pill restyle

## [1.2.3] - 2025-06-15

### Changed
- Login modal dark background is now dark blue

### Fixed
- Fixed login modal step separators in mobile viewport

## [1.2.2] - 2025-06-14

### Added
- Added home page visit event

### Changed
- Email step in login modal refined, cleaned texts and now not defaulting to sign up stepper

### Fixed
- Fixed tooltip light mode

## [1.2.1] - 2025-06-13

### Changed
- Changed browser alerts for MUI alerts in profile page
- Now cookies preferences appear collapsed by default

### Fixed
- Fixed date formatting

## [1.2.0] - 2025-06-13

### Added
- Added weekly updates backoffice section and functionalities

### Changed
- Changed backoffice dashboard to have two new buttons to clean cache and refresh youtube video ids
- Now all backoffice pages have dark mode implemented

## [1.1.1] - 2025-06-10

### Changed
- Reduced spacing in cookie banner for mobile

## [1.1.0] - 2025-06-10

### Added
- Added cookies preference
- Added privacy policy page
- Added more information to TyC page
- Added YouTube compliance info to both pages
- Added more info to footer

## [1.0.3] - 2025-06-09

### Added
- Added push notification logic for iOS.
- Added alert dialog indicating iOS users that subscriptions will be email-only unless installing PWA.
- Added PWA installation guide in the subscriptions page for iOS users with message of completion.
- Added notification method filter por iOS users.

### Changed
- Refactored sw logic

## [1.0.2] - 2025-06-05

### Changed
- Now we have 2 color palletes, one for each theme dark and light
- Subscription section colors are now the same as the grid's
- Changed existing step user message to use user first name and gender
- Made webpage logo clickable and with a redirect to the home page in pages other than the home page

## [1.0.1] - 2025-06-04

### Changed
- Changed program colors
- Changed bell button color
- Now sign up step icons and separators get painted blue when completing steps like a progress bar
- Changed session handling with refresh token
- Dark mode by default now
- Clicking on bell button logged out opens the login modal

### Removed
- Removed sign up progress bar

## [1.0.0] - 2025-06-02

### Changed
- Made home page public, without needing to have a session.
- All redirects for logged out users are now pointing to home page instead of login page

### Removed
- Removed legacy login for the official launch
- Removed backoffice login page as well
- Removed all console.log

## [0.4.6] - 2025-06-01

### Added
- Added integration to Posthog for metrics tracking

### Fixed
- Fixed schedules backoffice

## [0.4.5] - 2025-05-31

### Added
- Added several new GA4 events with demographics

### Changed
- Added demographics to preexisting events

## [0.4.4] - 2025-05-31

### Added
- Added gender and birth date fields to user signup, profile and backoffice

## [0.4.3] - 2025-05-31

### Changed
- Optimized home client, profile and subscription pages.

### Fixed
- Fixed backoffice schedules reloading every time and not deleting schedules

## [0.4.2] - 2025-05-27

### Changed
- Made some minor visual adjustments

### Fixed
- Fixed pushs again

## [0.4.1] - 2025-05-26

### Fixed
- Fixed push subscriptions generation

## [0.4.0] - 2025-05-25

### Added
- Added program subscriptions for users with favorites section and email & push notifications

## [0.3.10] - 2025-05-25

### Added
- Added user role to user backoffice

## [0.3.9] - 2025-05-25

### Changed
- Several ux tweaks and improvements, including removing backgrounds, aligning buttons and improving user menu and button

## [0.3.8] - 2025-05-21

### Changed
- Added session context to avoid duplicate requests and redirect to login when invalid session
- Multiple UX tweaks

## [0.3.7] - 2025-05-19

### Changed
- Made channel logos not draggable
- Reordered sign up buttons

## [0.3.6] - 2025-05-19

### Added
- Added users backoffice

## [0.3.5] - 2025-05-18

### Changed
- Moved header into new component
- Now in mobile only showing user icon
- Resized header, made it smaller in mobile

## [0.3.4] - 2025-05-18

### Added
- Added reset password to login flow

## [0.3.3] - 2025-05-18

### Added
- Added profile page

## [0.3.2] - 2025-05-17

### Removed
- Removed backoffice login, now using user role

## [0.3.1] - 2025-05-16

### Fixed
- Migrated all sessions related logic to next-auth

## [0.3.0] - 2025-05-16

### Added
- Added user sign up and login

## [0.2.4] - 2025-05-06

### Changed
- Made some visual adjustments, including replacing 100vh for 100dvh

## [0.2.3] - 2025-05-06

### Changed
- Made blur effect greater in legal layout
- Separated skeleton grid into two, one web and one mobile
- Added a bit more margin for the automatic scroll

## [0.2.2] - 2025-05-05

### Changed
- Made skeleton grid 10 rows for mobile

## [0.2.1] - 2025-05-04

### Changed
- Reverted legal page condition to show real logos

## [0.2.0] - 2025-05-04

### Added
- Added sleketon loading grid

### Changed
- Optimized some backend requests

## [0.1.21] - 2025-05-02

### Changed
- Optimized loading times

## [0.1.20] - 2025-05-02

### Added
- Added search boxes in backoffice
- Added mail button in footer for web

### Changed
- Changed holiday alert for dialog

## [0.1.19] - 2025-05-01

### Changed
- Moved theme button

## [0.1.18] - 2025-05-01

### Added
- Added holiday message

## [0.1.17] - 2025-04-30

### Added
- Added Microsoft Clarity integration

### Fixed
- Fixed stats request missing auth token

## [0.1.16] - 2025-04-28

### Changed
- Changed channel streaming_url field for handle field

## [0.1.15] - 2025-04-28

### Fixed
- Fixed mobile tooltip close behaviour

## [0.1.14] - 2025-04-27

### Changed
- Improved live periodic fetch
- Now embedding youtube playlists

## [0.1.13] - 2025-04-26

### Fixed
- Fixed grid vertical scrolling not showing all the channels

## [0.1.12] - 2025-04-26

### Added
- Added background colors to new channels

### Fixed
- Updated legal layout with normal layout changes

## [0.1.11] - 2025-04-26

### Changed
- Changed vertical scrolling. Now only the grid scrolls, not just the whole webpage
- Added a delay to the tooltip showing up logic

## [0.1.10] - 2025-04-21

### Changed
- Improved requests to backend, for better performance and avoid stuttering.

## [0.1.9] - 2025-04-20

### Added
- Added proposed changes backoffice section

## [0.1.8] - 2025-04-20

### Added
- Made grid horizontally draggable for trackpadless PCs

### Changed
- Reduced logo blurry effect

## [0.1.7] - 2025-04-19

### Added
- Added favicon

## [0.1.6] - 2025-04-19

### Added
- Added logo

## [0.1.5] - 2025-04-19

### Added
- Added configs backoffice

## [0.1.4] - 2025-04-19

### Fixed
- Added token to un-authenticated requests in channels backoffice
- Fixed channel not showing correctly in schedules backoffice

## [0.1.3] - 2025-04-18

### Changed
- Changed Channel for Canal

## [0.1.2] - 2025-04-18

### Added
- Added reorder channel feature to the channels backoffice
- Added backend set order for the channels in the grid

## [0.1.1] - 2025-04-18

### Removed
- Removed start_time and end_time fields from program type

## [0.1.0] - 2025-04-18

### Changed
- Now youtube link opens embedded modal


## [0.0.17] - 2025-04-15

### Added
- Added legal footer

## [0.0.16] - 2025-04-15

### Added
- Added schedule backoffice feature

## [0.0.15] - 2025-04-15

### Changed
- Now fetching schedule for today first, then all schedules in the background

## [0.0.14] - 2025-04-15

### Added
- Added panelist "bulk" creation from program edit dialog to create and add it to the program directly

## [0.0.13] - 2025-04-15

### Fixed
- Fixed backend response parsing

## [0.0.12] - 2025-04-14

### Added
- Added panelists text below program name

## [0.0.11] - 2025-04-14

### Added
- Added panelist backoffice functionality

## [0.0.9] - 2025-04-14

### Fixed
- Fixed mobile tooltip behaviour

## [0.0.9] - 2025-04-13

### Added
- Added backoffice views with auth and CRUD operations for channels and programs

## [0.0.8] - 2025-04-09

### Added
- Added password screen with env variable comparison

## [0.0.7] - 2025-04-07

### Changed
- Program names to uppercase
- Program logos + names

## [0.0.6] - 2025-04-07

### Fixed
- Fixed tooltip behaviour on mobile not dissapearing

## [0.0.5] - 2025-04-05

### Added
- Added changelog.
- Added pull request template.
- Added create-release script.

### Changed
- Modified .gitignore

## [0.0.4] - 2025-04-05

### Added
- Funcionalidad base del sitio con frontend en Next.js y backend en Nest.js.
- Scrapers de Luzu, Vorterix, Olga, Blender, Urbana, Gelatina, Bondi Live y La Casa Streaming.

