# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CalmDash** is an E-Ink optimized productivity dashboard built as a pure vanilla web application. It manages routines, schedules, and todos with all data stored in browser localStorage (no backend). The UI is in Korean.

## Running the App

No build system, package manager, or dependencies to install. Open `app/index.html` directly in a modern browser (supports `file://` protocol).

## Architecture

### Module Loading (order matters)

Scripts are loaded as Classic Scripts in `index.html` in strict dependency order:

1. **`app/js/constants.js`** - `INITIAL_DATA` defaults, `WEATHER_ICONS` WMO code mapping
2. **`app/js/utils.js`** - `generateUUID()`, `escapeHTML()`, `formatDate()`, `formatTime()`, `getTimeSelectorHTML()`
3. **`app/js/store.js`** - `Store` class (state management + localStorage persistence)
4. **`app/js/ui.js`** - All rendering functions and modal creation
5. **`app/js/main.js`** - App initialization, event listeners, clock/weather setup

All modules share the global scope. There are no ES module imports/exports — this was an intentional design choice (commit `41d9628`) to support `file://` execution.

### State Management (Observer Pattern)

The `Store` class in `store.js` is the single source of truth:

- **Persistence**: Reads/writes `productivity_hub_data_v1` key in localStorage
- **Reactivity**: `subscribe(listener)` registers callbacks; `notify()` triggers all subscribers on any data change
- **Flow**: User Action -> Store method -> `save()` -> `notify()` -> UI re-renders

### Data Model

Three entity types stored under `productivity_hub_data_v1`:

- **routines**: `{ id, title, time, isCompleted, repeat }` — repeat values: `"매일"|"평일"|"주말"|"월"-"일"`
- **schedules**: `{ id, title, date, start, end, isAllDay }`
- **todos**: `{ id, title, dueDate, priority, isCompleted }` — priority: `"high"|"medium"|"low"|"none"`
- **settings**: `{ sectionOrder, visibleSections, dateFormat, timeFormat }`

### Additional localStorage Keys

- `calm_dash_theme` - dark/normal theme
- `calm_dash_location_cache` - GPS cache (3-hour TTL)
- `calm_dash_show_all_routines` / `calm_dash_show_all_schedules` - filter toggles
- `calm_dash_todo_sort` - sort preference

### UI Rendering (`ui.js`)

The largest file (~577 lines). Key functions:
- `renderDashboardGrid()` - Reorders sections based on settings
- `renderRoutines()` / `renderSchedules()` / `renderTodos()` - Card rendering with smart filtering
- `showAddModal()` - Universal add/edit modal for all entity types
- `showSettingsModal()` - Section visibility, ordering, date/time format
- Event delegation uses `data-action` attributes on elements

### External APIs

- **Open-Meteo** (`api.open-meteo.com`) - Weather data (no API key needed)
- **BigDataCloud** (`api.bigdatacloud.net`) - Reverse geocoding
- **IP-API** (`ip-api.com`) - Fallback geolocation by IP

## Key Conventions

- **XSS prevention**: Always use `escapeHTML()` from `utils.js` when rendering user-generated content
- **Naming**: camelCase for functions, PascalCase for classes, UPPER_SNAKE_CASE for constants, kebab-case for data attributes
- **E-Ink design**: High contrast black/white, bold borders, no gradients/animations, hard shadows. CSS classes prefixed with `e-` (e.g., `e-btn`, `e-card`, `e-badge`)
- **Dark theme**: Toggled via CSS class on `<body>`, inverts colors for OLED/E-Ink
- **Responsive**: Mobile-first, 3-column grid at 640px+ breakpoint (`sm:grid-cols-3`)
- **Styling**: Tailwind CSS via CDN + custom classes in `app/css/style.css`
- **No automated tests**: Manual browser testing only
