# Floor planner — component spec

This document defines the shared drag-and-drop floor-planner used in two places on the Mzenas marketing site: as a new stage in `ai-onboarding.html` (first-time setup) and as an "Editar mapa" toggle inside `restaurant-operations.html` (later edits). Both integrations consume the same DOM block, the same CSS, and the same `initFloorPlanner(rootEl, options)` entry point. Persistence is intentionally out of scope: state lives in a module-scoped object for the session and resets on reload. This mirrors how every other mock on the site handles state today and keeps the scope tight.

A reader who stops here should leave with the shape of the thing: three panes (palette, canvas, inspector) plus a tab strip that lets the operator keep multiple floor plans (salón, terraza, barra, reservados) side by side. The canvas is a logical 1600 × 900 coordinate space rendered with `transform: scale()` so the whole room fits on tablet and desktop without horizontal scrolling, and a zoom bar + auto-fit-on-resize keep it that way. A rich catalogue of tables and room props lets any restaurant reproduce their real room, and a single JS entry point covers both host pages.

## Entry point

```js
initFloorPlanner(rootEl, {
  seed,           // optional — flat items array OR { plans: [{ id?, name, items, nextNum? }], activePlanId? }
  activePlanId,   // optional — which plan tab to open on mount
  onChange,       // optional (state) => void, fires on every mutation
  mode,           // 'onboarding' | 'ops-edit' — tiny copy/layout differences only
});
```

The function mounts the three panes and plans tab strip into `rootEl`, wires listeners, and returns `{ getState, setState, destroy }`. Host pages decide when to mount and unmount. There is no global singleton. A flat `seed` array is treated as a single "Salón principal" plan so existing call sites keep working.

## State model

```js
plannerState = {
  plans: [
    {
      id: 'planA',
      name: 'Salón principal',
      items: [
        { id: 'i1', kind: 'seat', shape: 'rect',  seats: 4, num: 1, x: 200, y: 160, rotation: 0 },
        { id: 'i2', kind: 'seat', shape: 'round', seats: 4, num: 6, x: 760, y: 200, rotation: 0 },
        { id: 'i3', kind: 'prop', shape: 'bar',   num: null, x: 40, y: 700, rotation: 0, w: 400, h: 60 },
      ],
      nextNum: 7,
    },
    { id: 'planB', name: 'Terraza', items: [], nextNum: 1 },
  ],
  activePlanId: 'planA',
  selectedId: null,
  zoom: 0.62, // rendered scale; auto-fit to container by default
};
```

Every plan carries its own `items` and its own `nextNum`. Table numbering is scoped per plan (Mesa 1 on the terraza is a different table from Mesa 1 in the salón). This keeps the data model trivial — adding, renaming, or deleting a plan is a pure array mutation — and matches how restaurants already think about their rooms.

Every item has `id`, `kind` (`'seat' | 'prop'`), `shape`, `x`, `y`, `rotation` (`0` or `90`). Seat items additionally carry `seats` and `num`. Prop items carry `null` for `num` and may carry resizable `w`/`h` for bar counters and walls. Base dimensions for each palette entry live in a `CATALOG` constant; a rotated rectangle renders by swapping `w` and `h` at draw time rather than mutating the catalogue values.

The ops-edit integration stores plans as a sibling `FLOOR_PLANS` array and round-trips them through the planner (see "Ops handoff" below).

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
| Elementos de sala      | Puerta         | prop | door   | —     | 80 × 16       | yes       |
| Elementos de sala      | Pilar / planta | prop | pillar | —     | 40 × 40       | no        |

Rectangles default to vertical because that is the more common "long communal table" case; a one-click rotate handle makes them horizontal. Rounds don't rotate (visually identical). Bars, walls, and doors rotate because orientation is the whole point.

## Plans tab strip

Above the canvas the operator sees a horizontally scrolling strip of plan tabs — one button per plan — followed by a "Nuevo plano" button. Clicking a tab switches which plan's `items` the canvas and inspector summary read from; the palette and catalogue stay identical. Each tab carries a small edit icon (rename via `prompt()`, or double-click the label, or press `F2`) and a close `×` that confirms before discarding non-empty plans. The close button is disabled when only one plan remains so the planner always has somewhere to drop items.

Default seed for the onboarding integration is two plans: **Salón principal** with six representative tables (2×4-top, 2×2-top, 1×6-top, 1×round-4) and an empty **Terraza**. The small count is deliberate — operators tweak a handful of tables faster than they clean up a crowded canvas, and the terraza tab makes the multi-room concept obvious without any explanation.

## Canvas

The canvas is a logical 1600 × 900 coordinate space. Items are absolutely positioned inside it at integer logical coordinates that always snap to 40 px; `x` and `y` are the top-left corner. The `.fp-canvas` element carries `width: 1600px; height: 900px` and a `transform: scale(zoom)` that visually resizes it to fit the available wrap. On mount and on every resize of the wrap (ResizeObserver), the planner auto-computes `zoom = min(1, wrapW / 1600, wrapH / 900)` so the entire room is visible end-to-end on tablet-landscape and desktop. Operators can override the auto-fit via the zoom bar (−, readout %, +, and a "Ajustar" button that reverts to auto-fit).

Pointer-event handlers convert client deltas into logical coordinates by dividing by `zoom`, so drag feels 1:1 at any zoom level. Items cannot overlap the canvas edges — drag and drop clamp to `[0, 1600 - itemW]` and `[0, 900 - itemH]`. Item-to-item overlap is **allowed**: real floor plans sometimes need a stool tucked under a bar, and policing overlap adds friction without much payoff for a demo.

Background is a dotted 40 px grid drawn with a repeating CSS `radial-gradient` so placement feels aligned without heavy grid lines. Selected items render with a 2 px accent outline and a small floating toolbar anchored above them (rotate · duplicate · delete). Seat items show their table number in the center.

## Interactions

**Drag from palette.** Palette thumbnails are `draggable="true"`. On `dragstart` we stash the catalogue key in `dataTransfer`; on `drop` over the canvas we compute the drop point in logical coordinates (dividing the client offset by the current zoom), snap to grid, create a new item with the next available `id` and (for seats) `num` from the active plan, and select it.

**Move existing item.** Canvas items use `pointerdown`/`pointermove`/`pointerup` — not HTML5 drag — because pointer events work cleanly on touch and let us keep the "ghost" rendered inside the canvas instead of the browser's default drag image. Moving snaps to the 40 px grid on pointerup.

**Select.** Tap/click an item → it becomes `selectedId`. Click on empty canvas → clear selection and show the plan summary in the inspector. Pressing `Delete`/`Backspace` removes the selected item when the planner root has focus.

**Rotate.** Toolbar button or `R` key toggles `rotation` between 0 and 90. Only meaningful for rotatable shapes; button is disabled otherwise. A rotated rectangle swaps `w` and `h`; the item's `x,y` stays anchored at the top-left corner after rotation so the item doesn't jump off-canvas.

**Duplicate.** Toolbar button clones the selected item one grid cell down-right, with a new `id` and (for seats) a new auto-incremented `num` from the active plan's `nextNum`.

**Renumber.** The inspector shows an editable `Nº mesa` text input for seat items. Changing it updates `num` immediately. No uniqueness check — the ops app tolerates collisions in its mock data and we keep the same laxness here.

**Switch plan.** Clicking a plan tab swaps the active plan. The palette stays the same; the canvas re-renders from the new plan's `items`; selection resets. Numbering state is per-plan so dropping a new 4-top onto "Terraza" picks up Terraza's own `nextNum`.

## Panes

**Palette (left, 220 px).** Scrollable column. Section headers match the table above. Each entry is a 64 × 64 thumbnail with a label and a seats badge ("4 plazas"). Draggable to the canvas.

**Canvas (center, flexible).** Plans tab strip on top, the scaled coordinate area in the middle, zoom bar pinned to the bottom-right corner. Also accepts drops from the palette.

**Inspector (right, 260 px).** When nothing is selected: a summary card with the active plan's `N mesas · M plazas` broken down by capacity, plus an empty-canvas hint if the plan has no items and a line of total-plan count when the restaurant has more than one plan. When a seat item is selected: its shape, seats count, editable `num`, rotate/duplicate/delete buttons. When a prop item is selected: its shape and resize handles where applicable (bar and wall get a width slider snapped to 40 px).

## Responsive

- **Desktop / landscape tablet (≥ 1025 px):** the three panes sit side by side in a 220 / 1fr / 260 grid at 520–760 px tall.
- **Portrait tablet (641–1024 px):** palette and inspector collapse above and below the canvas; canvas keeps a 480 px minimum height. Tab strip scrolls horizontally.
- **Mobile (≤ 640 px):** same stacked layout; zoom-bar "Ajustar" label hides to save space, plan "Nuevo plano" label hides to save space. Still functional but clearly not the primary target.

## Ops handoff

`restaurant-operations.html` drives its map off a `FLOOR_PLANS` array seeded with the same starter plans as onboarding, plus `status`/`time`/`order`/`items` fields attached to each seeded table so the existing popovers keep working without a "dummy grid" step. Entering edit mode converts `FLOOR_PLANS` into the planner's `{ plans }` shape one-to-one; on exit, the planner's state is projected back into `FLOOR_PLANS`, preserving `status`/`time`/`order`/`items` by matching on `(planId, num)`. New tables inserted during edit mode get `status: 'free'` and empty fields. Prop items (walls, doors, bar, pillars) are stored on each plan alongside its tables so the render loop can draw them behind the seat spots.

The ops header carries a plan selector (`<select>`) next to the "Editar mapa" button. Switching plans there swaps which plan the floor grid renders and keys the edit button's active-plan context.

## What this spec does not cover

Real persistence, per-plan zone-based reservations, overlap detection, pan (beyond the auto-fit), keyboard-only placement, accessibility beyond `aria-label` on controls, and undo/redo. All of these are reasonable future work; none are required to land the multi-room experience the brief asks for.
