# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install        # or npm install
bun run dev        # Vite dev server
bun run build      # tsc + Vite production build to dist/
bun run preview    # serve built app locally
```

No test framework or linter. TypeScript strict mode is enabled (`tsconfig.json`).

> [!IMPORTANT]
> `bun.lockb` is intentionally an **empty 0-byte file**. It's a sentinel so Cloudflare Pages auto-detects bun as the package manager. Don't delete it.

## Architecture

Vite 8 + React 19 + TypeScript 6 single-page app for drawing simulated running/walking routes and exporting GPX files.

### Module structure

`src/main.tsx` mounts `<App />` into `#root`. `src/app.tsx` is the orchestration component — wires hooks, components, and handlers together.

- **`src/types/route.ts`** — `LatLng`, `RouteType`, `AnchorSegment`, `DrawSegment` (anchor | stroke union)
- **`src/types/settings.ts`** — `RouteSettings` shape
- **`src/hooks/`** — stateful logic + side effects:
  - `use-map-instance.ts` initializes MapLibre once, exposes `containerRef` + `map`
  - `use-route-points.ts` keeps an ordered list of `DrawSegment[]`; derives `routePoints` (flattened polyline) and `anchors` via memo
  - `use-route-settings.ts` keeps pace/offset/elevation/duplicate/start-time/route-type, switches presets on route-type change
  - `use-drawing.ts` unified pointer gesture: tap → anchor, drag → stroke. Reconciles draggable anchor markers; click marker to remove
  - `use-preview-renderer.ts` rebuilds per-loop GeoJSON layers via RAF debouncing whenever route or offset settings change
  - `use-modal.ts` shows alert/confirm dialogs
- **`src/components/`** — UI: `AppHeader`, `AppLogo`, `MapCanvas`, `MapGeocoder`, `MapToolbar`, `ControlPanel`, `RouteTypeToggle`, `SliderField`, `RouteStatus`, `DateTimePicker`, `Modal` (primitive), `DarkModal` (alert/confirm), `HelpModal` (in-app step-by-step guide), `Tooltip` (portal-rendered)
- **`src/map/`** — pure MapLibre helpers: Nominatim geocoder fetch (`geocoder.ts`), preview line layer (`route-layer.ts`)
- **`src/drawing/`** — `interpolation.ts` (linear interpolation between anchors), `segments.ts` (flatten + Chaikin smoothing, segment-id helper)
- **`src/preview/loop-builder.ts`** — duplicates the route with a smoothed random walk offset (correlated noise) and Bezier transition curves between loops
- **`src/export/`** — GPX XML generation (`gpx-generator.ts`) and download orchestration (`export-controller.ts`, sub-samples to ≤10 000 points)
- **`src/shared/`** — Haversine distance (`geo.ts`), Park-Miller PRNG (`random.ts`), timezone-aware time helpers (`time.ts`), route-type presets (`presets.ts`, single source of truth for `DEFAULT_SETTINGS`)

### Data flow

1. User draws on map → `use-drawing` calls `appendAnchor` / `startStroke` / `appendStrokePoint` on `use-route-points`
2. `use-route-points` flattens segments → `routePoints` (memoized polyline with Chaikin smoothing)
3. `App` passes `routePoints` + offset settings to `use-preview-renderer`
4. Preview renderer calls `loop-builder` to generate offset duplicates, updates per-loop GeoJSON layers, reports total distance + flat display coords back to `App`
5. Export sub-samples cached display coords and generates GPX via `gpx-generator.ts`

### Key patterns

- **React 19 + hooks** — small components; cross-cutting state lives in hooks. The drawing gesture uses a single pointer flow that decides anchor vs stroke based on movement threshold.
- **Pure modules preserved** — `geo`, `random`, `time`, `presets`, `gpx-generator`, `export-controller`, `loop-builder`, `interpolation`, `segments`, `route-layer`, `geocoder` remain framework-agnostic and unit-testable.
- **Route type presets** — switching between run/walk in `use-route-settings` auto-adjusts pace, offsets, and elevation via `ROUTE_PRESETS` in `shared/presets.ts`. `DEFAULT_SETTINGS` is derived from `ROUTE_PRESETS[DEFAULT_ROUTE_TYPE]` so initial values can never drift from preset values.
- **Seeded randomness** — loop offsets use Park-Miller PRNG (`random.ts`) with deterministic seeds per loop index. Offsets are smoothed (correlated random walk) so the line stays visually smooth instead of zig-zagging.
- **GPX integrity** — timestamps run continuously across loops (haversine-based), elevation jitter is seeded (reproducible), point count is capped at 10 000 by uniform sub-sampling so Strava/Garmin can ingest the file. XML attribute values are escaped.
- **Timezone** — fixed to `Asia/Ho_Chi_Minh`. `parseStartTimeInput` interprets the `<input type="datetime-local">` value as wall-clock in that zone via `fromZonedTime`.

### UI patterns

- **Borderless flat style** — surfaces use solid colors + box-shadow for depth, no gradients except brand logo SVG.
- **Modal primitive** — `Modal` handles mount/unmount lifecycle, double-rAF for entry transition, ESC + backdrop close. `DarkModal` and `HelpModal` are thin wrappers.
- **Tooltips via React portal** — render to `document.body` with computed `position: fixed` so they're never clipped by an ancestor with `overflow: auto`. Auto-flips top/bottom based on viewport space.
- **Mobile-first** — base styles target mobile; `sm:` (≥640px) and `lg:` (≥1024px) progressively expand. Tap gesture detection sized for touch (6px threshold, 350ms tap window). 1-finger drag draws; 2-finger gesture cancels drawing for native pan/zoom.

### UI language

The UI is in Vietnamese. All user-facing strings (alerts, tooltips, button labels) are Vietnamese.
