# Floor planner — build notes

Restaurants can now draw their own room. The AI onboarding flow gained a "Diseña tu sala" stage between the menu review and the go-live QR, and the existing operations app gained an "Editar mapa" toggle on the Mapa de mesas screen. Both surfaces use the same drag-and-drop component so a restaurant that places a long 6-top on the terrace during onboarding sees the same palette, grid, and inspector when it later rearranges the room from the tablet. The change ships as two shared assets (`assets/floor-planner.css`, `assets/floor-planner.js`) plus small host-page integrations.

A reader who stops here should walk away with the shape of the thing: one component, two host pages, grid-snap placement, demo-only state. The rest of this document explains the plan we agreed on before building and what actually landed, so a future maintainer can tell the intentional scope from accidental gaps.

## Why this exists

The operations app already rendered a floor plan, but it was view-only and read from a hardcoded `TABLES` array of three table types (2-top, 4-top, 6-top) laid out in a fixed CSS grid. Real restaurants don't fit a 4-column auto-grid: a bar has a long communal 6-top along one wall, two cocktail 2-tops by the window, a cluster of 4-tops in the middle, a counter along the back. The onboarding flow also had no step where the operator described the room at all — we generated a QR, stopped at "menu is live", and left the table layout implicit. Giving the operator an honest map-building step closes that gap and makes the later operations screen feel like a continuation of the onboarding instead of a separate product.

## The plan we agreed on

We scoped the work as eleven numbered steps before writing any code. The short version of each, with the decision that pinned it, is:

1. **Spec the component on paper first.** Nail the palette, the canvas model, and the interactions so both host pages consume the same thing. Output: `plans/floor-planner-spec.md`.
2. **Build it as a self-contained block.** Three panes (palette, canvas, inspector), a single `initFloorPlanner(rootEl, options)` entry point, state in a module-scoped object, no globals.
3. **Wire the new onboarding stage.** Insert "Diseña tu sala" between review (stage-3) and live (renumbered stage-5), with a sixth step-dot and a seeded starter layout so the canvas is never blank.
4. **Update the review stage's next button** from "Publicar menu" to "Siguiente: diseñar sala", moving the publish action onto the new stage.
5. **Add edit mode to the ops Mapa de mesas** as a header toggle that swaps the card grid for the planner.
6. **Extend the ops rendering** so the floor grid supports both the default auto-layout and a custom absolute-positioned mode driven by the planner's `x/y/rotation`.
7. **Support the richer palette in the ops view without breaking existing logic** — add `kind: 'seat' | 'prop'`, store props in a sibling `PROPS` array so the occupancy stats, popover, and reservations sidebar keep working.
8. **Mobile and touch.** Single breakpoint at 900 px that stacks the panes; pointer events (not mouse events) for in-canvas drag.
9. **Copy, microcopy, and empty states** in Spanish, matching the existing onboarding tone.
10. **Validation pass** with the `render-page` skill on desktop and mobile for every affected view.
11. **Explicit non-goals**, so later work doesn't drift into what we consciously left out.

The three decisions worth re-reading because they shape everything else: the component lives in **both** onboarding and ops (same code, two hosts), placement uses a **grid-snap** canvas rather than pixel-free positioning, and state is **demo-only** (in-memory, no persistence, no storage key). The last one is why the onboarding layout and the ops layout don't hand off to each other — they're two independent demos that share a UI component, which is fine for a marketing site and keeps the scope small.

## What actually shipped

The eleven steps landed as agreed. Here's the map from plan to artefacts.

### Shared component (`assets/floor-planner.css`, `assets/floor-planner.js`)

A single `initFloorPlanner(rootEl, { seed, onChange, mode })` function mounts three panes into `rootEl` and returns `{ getState, setState, destroy }`. The catalogue has twelve palette entries across four groups — four rectangles (2/4/6/8-top, rotatable horizontal/vertical), three rounds (2/4/6), a taburete, a resizable bar counter, a resizable wall, a door, and a pillar. A reader who asked the original brief question — "can a restaurant with long 6-tops and small 2-tops reproduce their room?" — gets a yes without us having to predict which subset they need.

State lives in a module-scoped `plannerState` with a flat `items[]`. Seat items carry `seats` and `num`; props carry `w/h` for resizable ones. Every item has `x`, `y`, and `rotation` (0 or 90); coordinates always snap to a 40 px grid; a rotated rectangle renders by swapping `w` and `h` at draw time rather than mutating the catalogue.

Interactions use HTML5 drag for palette → canvas (native browser feel, works with keyboard too), and pointer events for moving items already on the canvas (clean on touch, lets us show a live preview without fighting the browser's default drag image). The selected item gets a floating toolbar above it with rotate / duplicate / delete, plus an `R` keyboard shortcut and `Delete` to remove. The inspector shows an editable `Nº mesa` input for seating items and a length slider for bar/wall props. When nothing is selected the inspector shows a summary card — `N mesas · M plazas` with a breakdown by capacity — so the pane never looks empty.

### Onboarding integration (`ai-onboarding.html`)

We added a new wide-layout stage between the review (stage-3) and the live QR (now stage-5). The step indicator grew from five dots to six, and `goToStage` was generalised to a `TOTAL_STAGES` constant so the progress bar and dot loop stay honest. The new stage seeds the canvas with a realistic starter layout — seven rectangles, two round tables, and a bar counter — so the operator's first interaction is tweaking rather than staring at a blank canvas. The review stage's primary button changed from "Publicar menu" to "Siguiente: diseñar sala"; publishing moved one stage later. A dev hook (`?stage=N`) deep-links to any stage for screenshotting and testing.

### Ops integration (`restaurant-operations.html`)

The Mapa de mesas header gained an "Editar mapa" button that toggles `body.editing-map`. In edit mode the reservations sidebar and the status legend hide, and the planner mounts in the space with the existing `TABLES` seeded as planner items. On exit, `commitOpsPlanner` projects the planner state back: each seat becomes a `TABLES` row, preserving `status/time/order/items` by matching on `num`; props land in a sibling `PROPS` array. The render path gained a `.floor-grid.custom` mode that switches the grid from `display: grid` to `position: relative` with absolute-positioned children, so the first time the operator saves a custom layout the ops screen starts respecting their coordinates. Non-seating props are excluded from occupancy stats and the popover because they carry `kind: 'prop'` and the existing logic now filters on `kind: 'seat'`. A dev hook (`?edit=1`) auto-enters edit mode on `window.onload` for screenshots.

### Validation

We rendered four views with the `render-page` skill and inspected both viewports:

- `ai-onboarding.html?stage=4` desktop and mobile — new stage renders, 6-dot stepper correct, seeded layout visible.
- `restaurant-operations.html` desktop — original card grid intact, "Editar mapa" button present in the header.
- `restaurant-operations.html?edit=1` desktop — three-pane editor mounts in place of the grid, existing 12 tables seeded into the canvas, summary card reads "12 mesas · 42 plazas".

One bug caught and fixed during validation: the ops page was mounting the planner into `<div class="floor-editor">`, which didn't carry the `.fp-root` grid-columns style, so the panes stacked vertically on desktop instead of laying out 220 / flex / 260. The fix adds and removes `fp-root` around the mount.

## What we deliberately did not do

The following were discussed and left out on purpose; they are not bugs.

- **Persistence.** Per the brief, layouts live in memory for the session and reset on reload. The operator can round-trip through edit mode within a session, but refreshing the ops page restores the hardcoded `TABLES`.
- **Handoff between onboarding and ops.** Because there's no storage layer, the layout an operator builds during onboarding is not read by the ops app. Both hosts are independent demos that share a UI.
- **Changes to `index.html`.** The landing page stays as-is. The brief asked about the onboarding and ops surfaces; we didn't promote this to a new pillar on the marketing page.
- **Overlap detection, multi-room tabs, pan/zoom, undo/redo, keyboard-only placement, accessibility beyond `aria-label` on controls.** All reasonable future work; none were required to deliver the drag-and-drop experience the brief asked for.

## Files changed

- New — `plans/floor-planner-spec.md`, `assets/floor-planner.css`, `assets/floor-planner.js`, `docs/floor-planner.md` (this file).
- Modified — `ai-onboarding.html` (new stage, renumbered step indicator, generalised `goToStage`, seed layout, `?stage` hook), `restaurant-operations.html` (Editar mapa button, custom floor-grid mode, `PROPS` array, `mountOpsPlanner` / `commitOpsPlanner`, `?edit` hook).

## Working on this later

If you come back to extend this, the seam to add real persistence is `mountOpsPlanner` and `commitOpsPlanner` in `restaurant-operations.html`. Replace the in-memory commit with a call to whatever backend exists, and load the saved layout into `TABLES` / `PROPS` at page init. The spec's "Ops handoff" section already describes the shape of the data each side expects.

If you extend the palette, the only file that needs to change is `assets/floor-planner.js` — add a row to `FP_CATALOG` and a key to the relevant group in `FP_GROUPS`. The rendering is data-driven off `shape`, so a new shape needs one CSS rule in `assets/floor-planner.css` (`.fp-item.shape-your-new-shape`) and, for the ops view, a matching `.room-prop.shape-your-new-shape` rule in `restaurant-operations.html` so props render behind seats on the committed layout.
