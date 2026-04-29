# Floor planner — component spec

This document defines the shared drag-and-drop floor-planner used in two places on the Mzenas marketing site: as a new stage in `ai-onboarding.html` (first-time setup) and as an "Editar mapa" toggle inside `restaurant-operations.html` (later edits). Both integrations consume the same DOM block, the same CSS, and the same `initFloorPlanner(rootEl, options)` entry point. Persistence is intentionally out of scope: state lives in a module-scoped object for the session and resets on reload. This mirrors how every other mock on the site handles state today and keeps the scope tight.

A reader who stops here should leave with the shape of the thing: three panes (palette, canvas, inspector), a 40 px snap grid, a rich catalogue of tables and room props so any restaurant can reproduce their real room, and a single JS entry point that both host pages call with slightly different options.

## Entry point

```js
initFloorPlanner(rootEl, {
  seed,         // optional array of items to prefill the canvas
  onChange,     // optional (state) => void, fires on every mutation
  mode,         // 'onboarding' | 'ops-edit' — tiny copy/layout differences only
});
```

The function mounts the three panes into `rootEl`, wires listeners, and returns `{ getState, setState, destroy }`. Host pages decide when to mount and unmount. There is no global singleton.

## State model

```js
plannerState = {
  items: [
    { id: 'i1', kind: 'seat',  shape: 'rect',  seats: 4, num: 1, x: 120, y: 80,  rotation: 0  },
    { id: 'i2', kind: 'seat',  shape: 'round', seats: 2, num: 2, x: 240, y: 80,  rotation: 0  },
    { id: 'i3', kind: 'prop',  shape: 'bar',            num: null, x: 40, y: 400, rotation: 0, w: 400, h: 60 },
    // ...
  ],
  nextNum: 3,
  selectedId: null,
};
```

Every item has `id`, `kind` (`'seat' | 'prop'`), `shape`, `x`, `y`, `rotation` (`0` or `90`). Seat items additionally carry `seats` and `num`. Prop items carry `null` for `num` and may carry resizable `w`/`h` for bar counters and walls. Base dimensions for each palette entry live in a `CATALOG` constant (see next section); a rotated rectangle renders by swapping `w` and `h` at draw time rather than mutating the catalogue values.

The ops-edit integration converts its existing `TABLES` array into this model on entry and projects it back on exit (see `plans/floor-planner-spec.md` §"Ops handoff").

## Catalogue (palette)

The palette is grouped into four sections. Every entry is a purely visual template; logic treats seat items uniformly by `seats` and draws them from `shape` + `w`/`h`.

| Group                  | Entry          | kind | shape  | seats | base w×h (px) | rotatable |
| ---------------------- | -------------- | ---- | ------ | ----- | ------------- | --------- |
| Mesas rectangulares    | 2-top pequeña  | seat | rect   | 2     | 80 × 80       | yes       |
| Mesas rectangulares    | 4-top          | seat | rect   | 4     | 80 × 160      | yes       |
| Mesas rectangulares    | 6-top larga    | seat | rect   | 6     | 80 × 240      | yes       |
| Mesas rectangulares    | 8-top banquete | seat | rect   | 8     | 80 × 320      | yes       |
| Mesas redondas         | Redonda 2      | seat | round  | 2     | 80 × 80       | no        |
| Mesas redondas         | Redonda 4      | seat | round  | 4     | 120 × 120     | no        |
| Mesas redondas         | Redonda 6      | seat | round  | 6     | 160 × 160     | no        |
| Barra y stools         | Taburete       | seat | round  | 1     | 40 × 40       | no        |
| Barra y stools         | Barra          | prop | bar    | —     | 400 × 60      | yes       |
| Elementos de sala      | Pared          | prop | wall   | —     | 200 × 16      | yes       |
| Elementos de sala      | Puerta         | prop | door   | —     | 60 × 16       | yes       |
| Elementos de sala      | Pilar / planta | prop | pillar | —     | 40 × 40       | no        |

The "vertical long table for 4–6 people, horizontal small table for 2" brief maps to: 4-top and 6-top rectangles rendered in their default vertical orientation, 2-top rectangle rendered in its default square orientation and rotated to horizontal with a single click. The other entries exist because the same component has to cover terraces, cocktail bars, and banquet halls without us pre-deciding which subset a given restaurant wants.

Rectangles default to vertical because that is the more common "long communal table" case; a one-click rotate handle makes them horizontal. Rounds don't rotate (visually identical). Bars, walls, and doors rotate because orientation is the whole point.

## Canvas

Fixed at 960 × 560 px on desktop, horizontally scrollable inside a 100 %-wide wrapper on mobile. Background is a dotted 40 px grid drawn with a repeating CSS `radial-gradient` so placement feels aligned without heavy grid lines. All items are absolutely positioned inside the canvas; `x` and `y` are the top-left corner in canvas coordinates and always snap to multiples of 40.

Items cannot overlap the canvas edges — drag clamps `x` to `[0, canvasW - itemW]` and `y` likewise. Item-to-item overlap is **allowed**: real floor plans sometimes need a stool tucked under a bar, and policing overlap adds friction without much payoff for a demo.

Selected items render with a 2 px accent outline and a small floating toolbar anchored above them (rotate · duplicate · delete). Hover state is a subtle shadow. Seat items show their table number in the center; round tables show `Nº 3` centered, rectangles show it oriented along the long axis.

## Interactions

**Drag from palette.** Palette thumbnails are `draggable="true"`. On `dragstart` we stash the catalogue key in `dataTransfer`; on `drop` over the canvas we compute the drop point, snap to grid, create a new item with the next available `id` and (for seats) `num`, and select it.

**Move existing item.** Canvas items use `pointerdown`/`pointermove`/`pointerup` — not HTML5 drag — because pointer events work cleanly on touch and let us keep the "ghost" rendered inside the canvas instead of the browser's default drag image. Moving snaps to the 40 px grid on pointerup; during drag we show a live preview at unsnapped coordinates and a faint snap-target rectangle at the snapped coordinates.

**Select.** Tap/click an item → it becomes `selectedId`. Click on empty canvas → clear selection and show the summary in the inspector. Pressing `Delete`/`Backspace` removes the selected item when the planner root has focus.

**Rotate.** Toolbar button or `R` key toggles `rotation` between 0 and 90. Only meaningful for rotatable shapes; button is disabled otherwise. Visually, a rotated rectangle swaps `w` and `h`; the item's `x,y` stays anchored at the top-left corner after rotation so the item doesn't jump off-canvas.

**Duplicate.** Toolbar button clones the selected item one grid cell down-right, with a new `id` and (for seats) a new auto-incremented `num`.

**Renumber.** The inspector shows an editable `Nº mesa` text input for seat items. Changing it updates `num` immediately. No uniqueness check — the ops app tolerates collisions in its mock data and we keep the same laxness here.

## Panes

**Palette (left, 220 px).** Scrollable column. Section headers match the table above. Each entry is a 64 × 64 thumbnail with a label and a seats badge ("4 plazas"). Draggable to the canvas.

**Canvas (center, flexible).** The grid-snap area described above. Also accepts drops from the palette.

**Inspector (right, 260 px).** When nothing is selected: a summary card with `N mesas · M plazas` broken down by capacity, plus the empty-canvas hint if the canvas is empty. When a seat item is selected: its shape, seats count, editable `num`, rotate/duplicate/delete buttons. When a prop item is selected: its shape and resize handles where applicable (bar and wall get a width slider snapped to 40 px).

## Ops handoff

`restaurant-operations.html` today drives the map off a hardcoded `TABLES` array (`{ num, type, status, time, order, items }`) where `type` is one of `'2-top'|'4-top'|'6-top'`. The edit-mode toggle converts this array into planner items via:

```
TABLES[i]  →  { id: 't'+num, kind: 'seat', shape: 'rect',
                seats: parseInt(type), num, x: ..., y: ...,
                rotation: 0 }
```

On exit, the planner's seat items update `TABLES` in place: `num`, `seats` (round-tripped to `${seats}-top`), and a new `x`/`y`/`rotation` stored alongside each entry. `status`, `time`, `order`, and `items` are preserved by matching on `num`; new tables inserted during edit mode get `status: 'free'` and empty fields. Prop items (walls, doors, bar, pillars) are stored in a sibling `PROPS` array so the render loop can draw them behind the seat spots.

## What this spec does not cover

Real persistence, multi-room tabs, zone-based reservations, overlap detection, pan/zoom, keyboard-only placement, accessibility beyond `aria-label` on controls, and undo/redo. All of these are reasonable future work; none are required to land the drag-and-drop experience the brief asks for.
