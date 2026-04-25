# Mzenas assets

This folder holds the brand assets used across the Mzenas site. The files prefixed with `mzenas-` come from the official branding package (`/tmp/branding.zip`, delivered 2026-04-25) and are the canonical versions to use going forward. Older `Mzenas-*.png` files predate that package and are kept for backwards compatibility with pages that still reference them; new work should prefer the canonical files below.

## Brand palette

The branding sheet defines two brand colors. Both are declared as CSS variables in `index.html`:

| Token | Hex | Role |
| --- | --- | --- |
| `--accent` | `#C0392B` | Mzenas red — primary brand color, used for the wordmark and accents |
| `--secondary` | `#7B3F00` | Mzenas brown — used in the secondary mark (the document/menu glyph) |

## Canonical assets (from the 2026-04-25 branding package)

| File | Source in zip | What it is | Where it is used |
| --- | --- | --- | --- |
| `mzenas-logo-principal.png` | `Logo principal.PNG` | Horizontal lockup: icon + "Mzenas" wordmark | `index.html` — Open Graph / Twitter share image (`og:image`) and the small mark in the footer |
| `mzenas-logo-vertical.png` | `APP vertical.PNG` | Vertical lockup: icon on top of the wordmark | `index.html` — hero logo at the top of the landing page |
| `mzenas-icon.png` | `Icono.PNG` | Icon-only mark on transparent background (no wordmark) | Reserved for inline UI use where the wordmark is redundant; not currently referenced |
| `mzenas-favicon.png` | `FAvicon.PNG` | Red rounded-square tile with the white icon | `index.html` — browser favicon (`<link rel="icon">`) |
| `mzenas-app-icon.png` | `App icon.PNG` | Red-to-brown gradient rounded-square tile with the white icon | `index.html` — iOS / Android home-screen icon (`<link rel="apple-touch-icon">`) |
| `mzenas-branding-sheet.png` | `Branding.png` | Full brand guide: logo variants, color swatches, usage examples | Reference only; not served on the site. Open this file to see how each variant is intended to be used. |

## Legacy assets

These files predate the official branding package and are no longer referenced by any page in the repo. They are kept for a short grace period so anything pointing at the old filenames (cached share images, external links, etc.) keeps resolving. They are safe to delete once you're confident nothing external depends on them.

| File | Notes |
| --- | --- |
| `favicon.png` | Superseded by `mzenas-favicon.png`. |
| `Mzenas-logo.png`, `Mzenas-logo-transparent.png`, `Mzenas-logo-trimmed.png`, `Mzenas-horizontal.png`, `Mzenas-story.png` | Earlier logo explorations. Superseded by `mzenas-logo-principal.png` / `mzenas-logo-vertical.png` / `mzenas-icon.png`. |
| `material-symbols-rounded.woff2` | Not legacy — this is the Google Material Symbols icon font used by the product mockup pages (`customer-flow.html`, `restaurant-operations.html`, `restaurant-kitchen.html`, `ai-onboarding.html`). Keep. |
