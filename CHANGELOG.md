# Changelog

Todas las modificaciones importantes de este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/)
y este proyecto utiliza [SemVer](https://semver.org/lang/es/).

## [Unreleased]

### Added

### Changed

### Removed

### Fixed

---

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

