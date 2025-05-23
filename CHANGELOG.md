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

## [0.3.8] - 2025-04-21

### Changed
- Added session context to avoid duplicate requests and redirect to login when invalid session
- Multiple UX tweaks

## [0.3.7] - 2025-04-19

### Changed
- Made channel logos not draggable
- Reordered sign up buttons

## [0.3.6] - 2025-04-19

### Added
- Added users backoffice

## [0.3.5] - 2025-04-18

### Changed
- Moved header into new component
- Now in mobile only showing user icon
- Resized header, made it smaller in mobile

## [0.3.4] - 2025-04-18

### Added
- Added reset password to login flow

## [0.3.3] - 2025-04-18

### Added
- Added profile page

## [0.3.2] - 2025-04-17

### Removed
- Removed backoffice login, now using user role

## [0.3.1] - 2025-04-16

### Fixed
- Migrated all sessions related logic to next-auth

## [0.3.0] - 2025-04-16

### Added
- Added user sign up and login

## [0.2.4] - 2025-04-06

### Changed
- Made some visual adjustments, including replacing 100vh for 100dvh

## [0.2.3] - 2025-04-06

### Changed
- Made blur effect greater in legal layout
- Separated skeleton grid into two, one web and one mobile
- Added a bit more margin for the automatic scroll

## [0.2.2] - 2025-04-05

### Changed
- Made skeleton grid 10 rows for mobile

## [0.2.1] - 2025-04-04

### Changed
- Reverted legal page condition to show real logos

## [0.2.0] - 2025-04-04

### Added
- Added sleketon loading grid

### Changed
- Optimized some backend requests

## [0.1.21] - 2025-04-02

### Changed
- Optimized loading times

## [0.1.20] - 2025-04-02

### Added
- Added search boxes in backoffice
- Added mail button in footer for web

### Changed
- Changed holiday alert for dialog

## [0.1.19] - 2025-04-01

### Changed
- Moved theme button

## [0.1.18] - 2025-04-01

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

