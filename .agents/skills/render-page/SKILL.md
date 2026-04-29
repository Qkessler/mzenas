---
name: render-page
description: Renders a local HTML file or an http(s):// URL in headless Firefox via geckodriver and saves desktop (1440px) and mobile full-page screenshots to a temp directory. Use whenever validating visual or landing-page changes in the mzenas static site, so the agent can read back the PNGs and confirm the page actually looks right before declaring the change done.
---

# render-page

The skill spawns a headless Firefox through geckodriver, navigates to the target HTML (local file or URL), and writes two full-page PNGs — desktop and mobile — into a fresh temp directory. It prints the two absolute paths on stdout so the agent can read the images back and visually verify the change.

## Setup

Run these once per machine. The skill's Rust binary is also built on demand; rebuild it after pulling changes to `src/main.rs`.

```bash
# 1. geckodriver (the WebDriver server that drives Firefox)
cargo install geckodriver        # or download from https://github.com/mozilla/geckodriver/releases

# 2. Firefox itself (geckodriver spawns it; the repo's `geckodriver/` folder is
#    only the upstream docs clone, not the binary)
brew install --cask firefox      # macOS; use your distro's package manager elsewhere

# 3. Build the skill's binary
cd .pi/skills/render-page && cargo build --release
```

Verify:

```bash
geckodriver --version
./.pi/skills/render-page/target/release/render-page --help
```

## Usage

From the repo root:

```bash
./.pi/skills/render-page/target/release/render-page index.html
./.pi/skills/render-page/target/release/render-page ai-onboarding.html --label onboarding
./.pi/skills/render-page/target/release/render-page https://mzenas.com
```

Local paths accept an appended query string, which is forwarded to the `file://` URL. Use it with the `?view=...` hooks the demos expose:

```bash
# Customer flow: landing | categories | items | cart | payment | confirmation | status
./.pi/skills/render-page/target/release/render-page 'customer-flow.html?view=cart' --label cf-cart

# Operations dashboard: tablemap | dashboard | menu | config (+ optional &edit=1 for floor-plan edit mode)
./.pi/skills/render-page/target/release/render-page 'restaurant-operations.html?view=menu' --label ops-menu

# AI onboarding: numeric stage 0–5 (also accepts ?stage=N for back-compat)
./.pi/skills/render-page/target/release/render-page 'ai-onboarding.html?view=3' --label ob-review

# Kitchen KDS: ?view=order&id=<n> opens the order detail panel
./.pi/skills/render-page/target/release/render-page 'restaurant-kitchen.html?view=order&id=2' --label kds-panel
```

Cart-dependent customer-flow views (cart, payment, confirmation, status) auto-seed the cart with the last-order sample so the page renders with realistic content.

Output looks like:

```
desktop: /var/folders/…/mzenas-render-XXXX/index-desktop.png
mobile:  /var/folders/…/mzenas-render-XXXX/index-mobile.png
```

Feed those paths to `read` to view the PNGs as attachments. The temp directory persists after the process exits so the agent can read the screenshots on the next turn; the OS cleans it up on reboot.

### Flags

- `--label <name>` overrides the filename prefix (defaults to the file stem or URL host).
- `--geckodriver <path>` points to a specific geckodriver binary. The default probes `PATH` first, then `~/.cargo/bin/geckodriver`.

## Known quirks

Output dimensions are approximate, not pixel-exact. Firefox enforces a minimum window width around 450–500px on macOS, so the "mobile" screenshot comes out roughly 500px wide instead of 390; the page still renders in its mobile responsive layout, so the output is representative of how the site looks on phones. On the desktop side, pages whose top-level CSS pins `html, body { height: 100% }` (or otherwise caps the document size) may come out narrower than the requested 1440px because `moz/screenshot/full` captures the layout viewport rather than the requested window size. Treat both PNGs as breakpoint smoke tests, not device previews: they tell you whether the page renders, loads its assets, and triggers the right responsive layout — not whether it is pixel-correct at 1440×900 or 390×844.

If geckodriver fails to launch Firefox with an error like `Process unexpectedly closed with status 1`, the most common cause is a Firefox version that is far newer or older than the installed geckodriver. `cargo install --force geckodriver` usually fixes it.

See [references/webdriver-endpoints.md](references/webdriver-endpoints.md) for the exact HTTP calls the binary makes, useful for debugging with `curl`.
