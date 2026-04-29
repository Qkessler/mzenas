# Linvo Figma Mock-ups Plan

## Context

Linvo is in the concept/proposal phase with zero design assets. We need to create end-to-end interactive Figma mock-ups for the SaaS side of the business (Pillar 1): the in-restaurant ordering experience and the restaurant operations dashboard. The goal is to have a tangible, clickable prototype that demonstrates the full customer journey and the kitchen/ops flow — useful for investor conversations, user testing, and aligning the founding team.

**Design inspiration:** Honest Greens — clean, minimal, image-forward, emoji-friendly, premium but accessible.
**Demo restaurant:** "Tu Restaurante" — Mediterranean tapas bar in Murcia (tapas, Spanish wines, seasonal plates). NO pintxos — that's Basque Country, not southern Spain.
**Accent color:** Warm Terracotta (#E07856) on a clean white/dark base.

---

## Figma File Details

**File:** [Linvo Mockups](https://www.figma.com/design/43G1EEZFj3TFeHFjK8jKzq/Untitled)
**File key:** `43G1EEZFj3TFeHFjK8jKzq`
**Account:** Enrique Kessler Martinez (qkessler@gmail.com)

> Note: The file is fully exportable (.fig) and can be imported into Dario's team or any other account with all variables, components, styles, and prototype connections intact.

### Pages (created)
| Page | ID | Purpose |
|------|----|---------|
| Design System | `0:1` | Color swatches, components, typography reference |
| Customer App | `3:2` | 8 mobile screens (375x812) for the diner experience |
| Restaurant Operations | `3:3` | 5 desktop/tablet screens (1440x900) for kitchen & management |

---

## Progress Tracker

### Phase 1: Design System — COMPLETE

| Step | Status | Details |
|------|--------|---------|
| Color variables | DONE | 15 variables in `Linvo/Colors` collection |
| Spacing/radius variables | DONE | 14 variables in `Linvo/Spacing` collection |
| Text styles | DONE | 8 styles (Display, H1, H2, H3, Body, Body/Medium, Caption, Overline) |
| Components | DONE | Button (3 variants), NavBar, CategoryPill (2 variants), MenuItemCard, Badge, CartFAB, QuantityStepper |

### Phase 2: Customer Mobile Web-App — COMPLETE (9 screens)

| Screen | ID | Description |
|--------|----|-------------|
| 1. Landing | `13:2` | Full-screen hero image, "TU RESTAURANTE" overlay, announcement banner, "Pedir ahora" CTA, "Repetir un pedido" link |
| 2. Menu Categories | `14:2` | NavBar, category pills (no emojis), chef picks carousel, category cards |
| 3. Menu Items | `15:2` | Vertical cards: optional hero photo on top, CAPS+BOLD name, description, badges, prices. Mix of hero and compact cards |
| 4. Item Detail | `17:2` | Hero image, extras checkboxes, notes input, stepper + CTA |
| 5. Cart | `18:2` | Items with steppers, "Dar prioridad" toggle per item, tip selection, totals, pay CTA |
| 6. Payment | `19:2` | Payment method selection, order summary, confirm |
| 7. Confirmation | `20:2` | Celebratory state, order #, estimated time |
| 8. Order Status | `22:2` | Progress tracker, item statuses, "Pedir mas" / "Pedir la cuenta" |
| 9. Payment Notification | `58:2` | Waiter push notification: "Mesa X ha pagado", payment summary, "Liberar mesa" CTA |

### Phase 3: Restaurant Operations — COMPLETE (6 screens)

| Screen | ID | Description |
|--------|----|-------------|
| 1. Kitchen Display (KDS) | `23:2` | Dark theme, color-coded order tickets grid, filter tabs |
| 2. Order Detail | `24:2` | Slide-over panel, checkable items, special requests in amber, actions |
| 3. Table Map | `25:2` | Sidebar nav, visual floor plan, color-coded table statuses, legend |
| 4. Dashboard | `26:2` | Stat cards, bar chart, popular items, quick actions |
| 5. Menu Management | `27:2` | Table view, availability toggles, category filters, CRUD actions |
| 6. Restaurant Configuration | `56:2` | Brand colors config, payment mode (al final/por comanda), double-block toggle |

### Phase 4: Prototype Connections — COMPLETE

| Connection Set | Count | Details |
|----------------|-------|---------|
| Customer core flow | 21 | Landing through Order Status, all forward/back nav |
| Menu item variants | 8 | Para picar, Ensaladas, Croquetas detail + nav |
| Cart & payment states | 9 | Payment method selection, toast, bill request |
| Order status states | 6 | Partial ready, all ready + nav |
| Restaurant sidebar nav | 25 | All sidebar items + KDS ticket clicks + order detail actions |
| KDS states | 3 | Filter tabs, Mesa 7 order detail |
| Table map states | 5 | Table detail overlay, updated map, sidebar nav |
| **Total** | **77** | |

### Phase 4b: New Screens Created

| Screen | Page | Purpose |
|--------|------|---------|
| 3a. Para picar | Customer | Category items list |
| 3b. Ensaladas | Customer | Category items list |
| 3c. Menu Items — Toast | Customer | Item added confirmation toast |
| 4a. Croquetas Detail | Customer | Alternative item detail |
| 6a. Payment — Apple Pay | Customer | Selected payment method state |
| 6b. Payment — Tarjeta | Customer | Card input fields |
| 8a. Bill Request Sent | Customer | Bill confirmation |
| 8b. Order Status — Partial | Customer | Partially ready items |
| 8c. Order Status — Ready | Customer | All items ready |
| 1a. KDS — New Order | Restaurant | 9th order appears |
| 1b. KDS — Nuevos | Restaurant | Filtered view |
| 1c. KDS — Order Ready | Restaurant | Mesa 12 marked ready |
| 2a. Order Detail — Mesa 7 | Restaurant | Alternative order detail |
| 3a. Table Map — Updated | Restaurant | Mesa 7 freed |
| 3b. Table Detail — Mesa 7 | Restaurant | Table info overlay |
| Demo Flow (4 frames) | Demo Flow | Cross-device presentation moments |

### Phase 4c: Demo Assets

- Demo script: `plans/linvo-demo-script.md`
- Prototype starting points: "Customer Journey" (Landing) and "Kitchen View" (KDS)
- Demo Flow page with 4 cross-device presentation frames

---

## Variable IDs Reference (for resuming work)

### Color Variables (`Linvo/Colors`, Collection: `VariableCollectionId:4:2`, Mode: `4:0`)
| Variable | ID | Hex |
|----------|----|-----|
| Primary/Default | `VariableID:4:3` | #E07856 |
| Primary/Dark | `VariableID:4:4` | #C4613F |
| Primary/Light | `VariableID:4:5` | #F5D0C3 |
| Background/Default | `VariableID:4:6` | #FFFFFF |
| Surface/Default | `VariableID:4:7` | #F8F6F3 |
| Surface/Dark | `VariableID:4:8` | #1A1A1A |
| Text/Primary | `VariableID:4:9` | #1A1A1A |
| Text/Secondary | `VariableID:4:10` | #6B6B6B |
| Text/OnPrimary | `VariableID:4:11` | #FFFFFF |
| Text/OnDark | `VariableID:4:12` | #FFFFFF |
| Semantic/Success | `VariableID:4:13` | #4CAF50 |
| Semantic/Warning | `VariableID:4:14` | #FFA726 |
| Semantic/Error | `VariableID:4:15` | #EF5350 |
| Border/Default | `VariableID:4:16` | #E8E4DF |
| Border/Light | `VariableID:4:17` | #F0ECE8 |

### Spacing Variables (`Linvo/Spacing`, Collection: `VariableCollectionId:5:2`, Mode: `5:0`)
| Variable | ID | Value |
|----------|----|-------|
| Space/4 | `VariableID:5:3` | 4px |
| Space/8 | `VariableID:5:4` | 8px |
| Space/12 | `VariableID:5:5` | 12px |
| Space/16 | `VariableID:5:6` | 16px |
| Space/20 | `VariableID:5:7` | 20px |
| Space/24 | `VariableID:5:8` | 24px |
| Space/32 | `VariableID:5:9` | 32px |
| Space/40 | `VariableID:5:10` | 40px |
| Space/48 | `VariableID:5:11` | 48px |
| Radius/8 | `VariableID:5:12` | 8px |
| Radius/12 | `VariableID:5:13` | 12px |
| Radius/16 | `VariableID:5:14` | 16px |
| Radius/24 | `VariableID:5:15` | 24px |
| Radius/Full | `VariableID:5:16` | 999px |

### Text Style IDs
| Style | ID |
|-------|----|
| Display | `S:899724cbd476fa3275a999dd5ed1c1a29208e365,` |
| H1 | `S:8a37834153e99ed8ce19a5656f2df102c2d12aca,` |
| H2 | `S:844be13d0200314101b41ebf78a49c535643984a,` |
| H3 | `S:99b452fb46fc77c86e8633555239c1f9d27e7afa,` |
| Body | `S:58185dac7fd69156e07927493ebabe3e927d908e,` |
| Body/Medium | `S:33a184d9ed4c68ec4f7148e8b51fd620aa98a4b9,` |
| Caption | `S:aa6577899dd2231a3bd3b8884d89ccfb32775431,` |
| Overline | `S:7f22997b491f8e6662c20a661e25a5fea068bbc1,` |

### Component IDs
| Component | ID | Notes |
|-----------|----|-------|
| Button (set) | `7:8` | 3 variants: primary (`7:2`), secondary (`7:4`), ghost (`7:6`) |

### Available Inter Font Styles
Bold, Semi Bold, Medium, Regular, Extra Bold, Extra Light, Light, Thin, Black (+ italic variants)

---

## Phase 1: Design System & Variables

Create the foundational design system in Figma before any screens.

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#E07856` (Terracotta) | CTAs, active states, highlights |
| Primary Dark | `#C4613F` | Pressed states, headers |
| Primary Light | `#F5D0C3` | Subtle backgrounds, badges |
| Background | `#FFFFFF` | Main canvas |
| Surface | `#F8F6F3` | Cards, elevated sections |
| Text Primary | `#1A1A1A` | Headings, body |
| Text Secondary | `#6B6B6B` | Captions, hints |
| Success | `#4CAF50` | Order ready, confirmed |
| Warning | `#FFA726` | Prep time alerts |
| Error | `#EF5350` | Errors, cancellations |
| Border | `#E8E4DF` | Dividers, card edges |

### Typography (Inter font family)
- Display: 28px / Bold — restaurant name on landing
- H1: 24px / Semibold — screen titles
- H2: 20px / Semibold — section headers
- H3: 16px / Semibold — card titles, item names
- Body: 15px / Regular — descriptions
- Caption: 13px / Regular — prices, metadata
- Overline: 11px / Medium / Uppercase — category labels, badges

### Spacing & Grid
- Base unit: 8px
- Mobile grid: 375px wide, 16px side margins, 8px gutter
- Desktop/tablet grid: 1024-1440px, 24px margins, 16px gutter
- Border radius: 12px (cards), 8px (buttons), 24px (pills/chips)

### Core Components to Build
1. **Button** — primary (terracotta fill), secondary (outlined), ghost, icon-only
2. **Card** — menu item card (image + text + price), order ticket card (kitchen)
3. **Navigation bar** — top bar with back arrow, title, action icons
4. **Bottom sheet** — item detail overlay
5. **Tab bar** — category navigation (scrollable pills)
6. **Input** — text field, number stepper, textarea (special requests)
7. **Badge** — status (new, preparing, ready), dietary (vegan, gluten-free)
8. **Cart FAB** — floating action button showing item count

---

## Phase 2: Customer Mobile Web-App (8 screens)

Frame size: 375x812 (iPhone standard). All screens for "Tu Restaurante".

### Screen 1: Restaurant Landing (post-QR scan)
- Full-width hero image of the restaurant/terrace (bleed to top)
- Restaurant name "Tu Restaurante" overlaid with subtle gradient
- Tagline: "Tapas mediterraneas desde 2024"
- Key info row: rating, distance/location, opening hours
- CTA button: "Ver la carta" (See the menu)
- Subtle Linvo branding at bottom

### Screen 2: Menu Categories
- Top bar: "Tu Restaurante" + search icon
- Horizontal scrollable category pills with emojis:
  - "Para picar" (snacks), "Ensaladas" (salads), "Tapas calientes", "Carnes y pescados", "Postres", "Bebidas"
- Featured/hero section: "Recomendaciones del chef" with horizontal card carousel
- Below: vertical list of categories as large tappable cards with background images

### Screen 3: Menu Items List (within a category)
- Top bar with back arrow + category name (e.g., "Tapas calientes")
- Grid/list of item cards, each with:
  - Square image (left or top)
  - Item name (bold), short description (1 line)
  - Price (right-aligned)
  - Optional dietary badges (V, GF)
- Floating cart button at bottom-right showing item count + total

### Screen 4: Item Detail (bottom sheet overlay)
- Large hero image of the dish at top
- Item name, full description, price
- Customization section: "Extras" with checkboxes (e.g., "Extra de alioli +1.50EUR")
- "Notas especiales" textarea
- Quantity stepper (- 1 +)
- Full-width CTA: "Anadir al pedido - EUR X.XX"

### Screen 5: Cart / Order Summary
- Top bar: "Tu pedido" with X to close
- List of items: image thumbnail, name, quantity stepper, line total
- Special requests shown per item
- Divider
- Subtotal, optional tip selector (0%, 5%, 10%, custom)
- Total
- CTA: "Pagar EUR XX.XX"

### Screen 6: Payment
- Payment method selector: Apple Pay, Google Pay, card
- Card input fields (if card selected)
- Order summary collapsed
- CTA: "Confirmar pago"

### Screen 7: Order Confirmation
- Celebratory state: checkmark animation area, confetti-like
- "Pedido confirmado!" with order number #042
- "Tiempo estimado: ~15 min"
- Summary of what was ordered (collapsed)
- "Tu camarero te avisara cuando este listo"
- Button: "Ver estado del pedido"

### Screen 8: Order Status Tracking
- Order number at top
- Vertical progress tracker:
  - "Pedido recibido" (check)
  - "En preparacion" (active, pulsing)
  - "Listo para servir" (pending)
- Items listed with individual status
- Option to "Pedir mas" (order more) or "Pedir la cuenta" (request the bill)

---

## Phase 3: Restaurant Operations Web-App (5 screens)

Frame size: 1440x900 (desktop) or 1024x768 (tablet). Dark-mode option for kitchen displays.

### Screen 1: Kitchen Display System (KDS)
- Dark background for kitchen visibility
- Grid of order ticket cards (3-4 columns)
- Each ticket shows: table number, order time, elapsed timer, items list
- Color-coded urgency: green (fresh), amber (>10min), red (>20min)
- Tap/click a ticket to expand detail
- Top bar: restaurant name, current time, active orders count
- Filter tabs: "Todos", "Nuevos", "En preparacion", "Listos"

### Screen 2: Order Detail (expanded ticket)
- Modal/panel overlay on KDS
- Full item list with checkboxes to mark "prepared"
- Special requests highlighted in amber
- Customer notes visible
- Table number and time prominently displayed
- Actions: "Marcar como listo", "Notificar al cliente"

### Screen 3: Table Map / Management
- Visual floor plan with table shapes (2-top, 4-top, 6-top, bar seats)
- Color-coded status: green=free, terracotta=occupied, grey=reserved
- Tap table to see: current order, time seated, bill total
- Sidebar: upcoming reservations list
- Stats bar: X/Y tables occupied, avg. seating time

### Screen 4: Dashboard (Today's Overview)
- Top stat cards: total covers today, revenue, avg order value, avg table time
- Live chart: orders per hour (bar chart)
- Popular items ranking
- Recent activity feed (orders, payments, reservations)
- Quick actions: "Crear oferta", "Gestionar carta"

### Screen 5: Menu Management
- Table/list view of all menu items grouped by category
- Each row: image thumbnail, name, price, availability toggle
- Edit button opens inline editor or modal
- Add new item button
- Drag to reorder
- Bulk actions: enable/disable category

---

## Phase 4: Interactive Prototype Connections

### Customer Flow
```
Landing -> Menu Categories -> Items List -> Item Detail (overlay)
                                             |
                                        Cart (via FAB) -> Payment -> Confirmation -> Status
```
- Item Detail opens as bottom sheet (overlay), dismiss returns to Items List
- Cart FAB accessible from any menu screen
- Back navigation on all screens

### Restaurant Flow
```
KDS <-> Order Detail (overlay)
Dashboard <-> Table Map
Dashboard <-> Menu Management
```
- KDS is the home screen for kitchen staff
- Dashboard is the home screen for managers
- Sidebar navigation between all 5 screens

---

## Phase 5: Execution Order

Build sequence (when rate limit resets):

1. ~~**Create Figma file** in the specified team/project~~ DONE
2. ~~**Set up variables** (colors, spacing/radius tokens)~~ DONE
3. **Create text styles** (Display, H1, H2, H3, Body, Body/Medium, Caption, Overline)
4. **Build components** (buttons, cards, nav bars, etc.) on "Design System" page
5. **Customer screens** (screens 1-8) on "Customer App" page (ID: `3314:2`)
6. **Operations screens** (screens 1-5) on "Restaurant Operations" page (ID: `3314:3`)
7. **Prototype links** (connect flows)
8. **Polish** — alignment, spacing consistency, final review

---

## Verification

- [x] Figma file cleaned and pages created (Design System, Customer App, Restaurant Operations)
- [x] Color variables created (15 tokens in Linvo/Colors)
- [x] Spacing/radius variables created (14 tokens in Linvo/Spacing)
- [x] Text styles created (8 styles in Linvo/ namespace)
- [x] Core components built (buttons, cards, nav, badges, inputs, FAB)
- [x] All 8 customer screens created and visually consistent
- [x] All 5 restaurant ops screens created and visually consistent
- [x] Customer prototype: interactive flow connections (landing -> menu -> order -> pay -> confirm -> status)
- [x] Kitchen prototype: interactive flow connections (KDS -> order detail -> mark ready)
- [x] 20 new screens created (variants, states, demo frames)
- [x] 77 total prototype connections wired
- [x] Demo Flow page with cross-device presentation moments
- [x] Demo script written (plans/linvo-demo-script.md)
- [x] File exportable as .fig for import into any Figma account
