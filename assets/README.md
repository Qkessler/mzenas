# Mzenas assets

This folder holds the brand assets used across the Mzenas site. All PNGs prefixed with `mzenas-` come from the official branding package (`/tmp/branding.zip`, delivered 2026-04-25) and are the canonical versions. The earlier `Mzenas-*.png` explorations were removed on 2026-04-29 once the demo pages (`customer-flow/`, `restaurant-kitchen/`, `restaurant-operations/`, `ai-onboarding/`) were migrated to the canonical logo; if you need one for historical reference, recover it from git history.

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
| `mzenas-favicon.png` | `FAvicon.PNG` | Red rounded-square tile with the white icon | `index.html` — browser favicon (`<link rel="icon">`) and the icon half of the landing-page hero lockup. Also paired with a bold "Mzenas" text span to build the header/footer lockup on every demo page (`customer-flow/`, `restaurant-kitchen/`, `restaurant-operations/`, `ai-onboarding/`), so the demos match the landing page's typographic treatment rather than shipping a pre-rendered wordmark. |
| `mzenas-app-icon.png` | `App icon.PNG` | Red-to-brown gradient rounded-square tile with the white icon | `index.html` — iOS / Android home-screen icon (`<link rel="apple-touch-icon">`) |
| `mzenas-branding-sheet.png` | `Branding.png` | Full brand guide: logo variants, color swatches, usage examples | Reference only; not served on the site. Open this file to see how each variant is intended to be used. |

## Other files

`material-symbols-rounded.woff2` is the Google Material Symbols icon font used by the product mockup pages (`customer-flow/`, `restaurant-operations/`, `restaurant-kitchen/`, `ai-onboarding/`). Not a brand asset, but lives here so every page can pull fonts and logos from the same folder.

The previous `favicon.png` (a white-background legacy copy from before the branding migration) was removed on 2026-04-25 as part of consolidating on the single canonical `mzenas-favicon.png`, which already ships with a transparent background.
