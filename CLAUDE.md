# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev      # start Vite dev server
npm run build    # TypeScript check (tsc) + Vite production build to dist/
npm run preview  # serve built app locally
```

No test framework or linter is configured. TypeScript strict mode is enabled (`tsconfig.json`).

## Architecture

Vite 8 + TypeScript 6 single-page app for drawing simulated running/walking routes and exporting them as GPX files.

### Module structure

`src/main.ts` is the orchestration layer — it wires together all modules but does not contain drawing/preview/export logic directly.

- **`src/types/route.ts`** — `LatLng`, `DrawMode`, `RouteType` shared types
- **`src/state/app-state.ts`** — mutable app state object (route points, markers, drawing flags, preview cache) created via `createAppState()`
- **`src/dom/elements.ts`** — typed DOM element references queried once at startup via `getDomElements()`
- **`src/map/`** — MapLibre GL map init (`map-instance.ts`), Nominatim geocoder with debounce (`geocoder.ts`, `geocoder-ui.ts`), route line layer (`route-layer.ts`)
- **`src/drawing/`** — Click mode with marker placement + interpolation (`click-drawing.ts`, `interpolation.ts`), freehand mode with pointer/touch tracking (`freehand-drawing.ts`)
- **`src/preview/`** — Loop builder duplicates route with seeded random offsets and Bezier transition curves (`loop-builder.ts`); preview renderer manages per-loop GeoJSON layers with RAF debouncing (`preview-renderer.ts`)
- **`src/export/`** — GPX XML generation with timestamps and synthetic elevation (`gpx-generator.ts`), file download orchestration (`export-controller.ts`)
- **`src/shared/`** — Haversine distance (`geo.ts`), seeded PRNG — Park-Miller (`random.ts`), timezone-aware time helpers (`time.ts`)
- **`src/ui/`** — Custom alert/confirm modals (`modal.ts`), button state and route info display (`status.ts`)

### Data flow

1. User draws on map → points accumulate in `state.routePoints`
2. Any change triggers `onRouteChanged()` → `previewRenderer.refreshPreview()` (RAF-debounced)
3. Preview renderer calls `loop-builder` to generate offset duplicates, updates per-loop GeoJSON map layers
4. Export flattens display coords and generates GPX via `gpx-generator.ts`

### Key patterns

- **No framework** — vanilla TypeScript with DOM manipulation. UI controls are in `index.html`, event wiring in `main.ts`.
- **Slider pairs** — each setting has a range slider + number input synced in `main.ts` (lines 206–239). Adding a new slider requires updating `sliderPairs`, `DomElements`, and `read*()` functions.
- **Route type presets** — switching between run/walk auto-adjusts pace, offset, and elevation via `PRESETS` in `main.ts`.
- **Seeded randomness** — loop offsets use Park-Miller PRNG (`random.ts`) with deterministic seeds per loop index for reproducible previews.
- **Timezone** — fixed to `Asia/Ho_Chi_Minh` for default start time. GPX timestamps are generated incrementally from pace and segment distance.

### UI language

The UI is in Vietnamese. All user-facing strings (alerts, tooltips, button labels) in `index.html` and `src/ui/` are Vietnamese.
