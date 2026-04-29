# NFC on tables

Short answer: yes, it's technically feasible and actually a well-trodden path — but NFC should be a *complement* to QR, never a replacement. This doc covers the feasibility reasoning and a concrete plan to prototype it.

## Feasibility

### How it would work

Stick a passive NFC tag on each table (sticker, coaster, little acrylic stand, under-table puck). The tag stores a URL — same shape as the QR payload, e.g. `https://mzenas.app/t/<restaurant>/<table>?s=<session>`. Customer taps phone, phone opens the browser to that URL, same flow as scanning the QR drops them into.

Passive NTAG tags (NTAG213/215/216) are the standard choice: no battery, no pairing, no app, ~€0.10–0.30 each in bulk, readable by basically any NFC-capable phone out of the box. NTAG213 (144 bytes usable) is plenty for a URL; NTAG215/216 only matter if you want to stuff more data or signed payloads on the tag itself.

### The "works out of the box" part

On **iPhone XS and newer (iOS 14+)**, background NFC tag reading is on by default — unlock the phone, hold it near the tag, a banner pops up, tap it, browser opens. No app needed. iPhone 7 through X require opening Control Center and tapping an NFC reader button, which is friction you don't want. Anything older than iPhone 7: no NFC at all for tag reading.

On **Android**, it's more uneven. Most mid-to-high-end phones from the last 8 years have NFC and will open a URL tag automatically if NFC is enabled in settings. But: budget phones (especially in emerging markets, and a lot of the Xiaomi/Realme/Redmi lineup) ship without NFC hardware, and some users have NFC disabled. You have no way to detect this server-side.

Realistically, in a Western European dine-in crowd you're probably looking at 85–95% of phones being able to tap successfully on first try. Elsewhere, lower.

### Why QR still has to stay

1. **Hardware coverage.** The cheap-phone long tail doesn't have NFC. If a group of four sits down and one person can't tap, they need a fallback *on the same physical marker*, not "go ask the waiter."
2. **Discoverability.** Customers know what QR codes are for now. NFC is still "wait, do I just… touch it?" for a lot of people. A combined marker ("Tap or scan") teaches itself.
3. **Distance / multi-user.** Four people can scan one QR simultaneously from across the table. NFC requires each person to physically reach and tap, one at a time. For a group ordering flow this matters.
4. **iOS edge cases.** Older iPhones, locked phones, phones in cases with metal or magnetic wallets — all degrade NFC. QR just needs a camera.

### What the table marker should look like

One combined artifact: a small acrylic stand or sticker with the QR printed on it and the NFC tag laminated behind/under it, both encoding the same URL. Cost is maybe €0.50–1.50 per table all-in. Any failure mode on one channel falls back to the other with zero extra instruction to the customer.

### Things worth flagging before committing

- **Tag write-protection.** Lock the tags after programming (NTAG has a one-way lock bit). Otherwise a prankster with any NFC-writer app can rewrite your table tag to point at a phishing URL in about 10 seconds. This is a real attack and has happened to parking-meter and menu deployments.
- **Per-table provisioning cost.** Someone has to program and stick ~N tags per restaurant. Doable with a phone app in a few minutes per venue, but it's onboarding work that pure-QR doesn't have (you can print QRs from a laptop).
- **Surface material.** NFC doesn't read through metal. If tables are metal or have metal trim where the marker goes, you need a ferrite-backed tag (a bit more expensive, ~€0.40–0.80) or mount the marker on a non-metal stand.
- **Analytics parity.** Make sure the QR and NFC URLs are identical (or only differ in a `src=nfc` / `src=qr` query param you strip server-side) so session/table identity is the same either way. Otherwise you'll have fun bugs where "the same table" looks like two tables depending on entry method.

### Recommendation

Ship QR first, because it works for 100% of smartphones and is the zero-risk path. Add NFC as a second channel on the same physical table marker in a later iteration, positioned as a speed upgrade ("tap to order") rather than the primary mechanism. That way NFC non-support is never a blocker, it's just a slightly slower path for those users — which is exactly where you want the fallback to sit.

## Implementation

### The short version

There's no "NFC tag provider" in the SaaS sense — NFC tags are dumb passive chips you buy in bulk from any electronics supplier (Amazon, AliExpress, or specialists like GoToTags, Shopnfc, Identiv, Seritag). You program them yourself. The NFC Forum defines the standard (NDEF — NFC Data Exchange Format), and every tag that follows it is interchangeable regardless of who sold it.

For a prototype, buying a pack of 10–50 NTAG213 stickers for €10–20 and programming them with a phone app is the fastest path. You'll have something to tap against in 2–3 days, most of which is shipping time.

### What to buy

For a first test, get **NTAG213 stickers**, round, 25–30mm, with adhesive back. NTAG213 is the most widely compatible chip — every iPhone (XS+) and Android with NFC reads it without fuss. 144 bytes of user memory, which fits a URL up to ~130 chars comfortably.

Concrete options:
- **Amazon**: search "NTAG213 NFC stickers" — packs of 50 run €15–25. Brands like TimeskeyNFC, ZOWEETEK are fine for prototyping.
- **Shopnfc.com** (Italy, ships EU-wide, cleaner product pages, lets you filter by chip type and form factor). Good if you want to understand what you're buying.
- **GoToTags.com** (US-based, also sells a desktop encoder).
- **AliExpress** if you don't mind 3-week shipping and want to pay €5 for 50 tags.

If your test tables are metal or have a metal underside where you'd stick the tag, buy **"on-metal" NTAG213** instead — same chip, ferrite layer behind it. Costs about 2–3× more.

### How to program them

Three options, in order of "just want to try it" to "production workflow."

**Option 1: phone app (5 minutes).** This is what you want for the first test. Install **NFC Tools** (by wakdev, iOS + Android, free). Open it → Write → Add record → URL → paste `https://mzenas.app/t/demo/table-1` → Write. Hold tag to phone's NFC area (top-back on Android, top-edge on iPhone). Done. To protect the tag, use the "Lock tag" function after writing — *this is irreversible*, so only lock once you're sure of the URL.

Same app also reads tags, which is useful for debugging ("what URL did I actually write to this one?").

**Option 2: desktop encoder + CLI for batch.** When you're programming 50+ tags per restaurant, phone tapping gets old. You want a USB NFC reader/writer:

- **ACR122U** (~€35, the de facto standard cheap reader). Works on macOS/Linux/Windows.
- **Identiv uTrust 3700 F** (~€45, more reliable driver situation on macOS).

With one of these plugged in, you have real programmatic control:

- **libnfc** + **nfc-tools** (C, Linux/macOS via Homebrew: `brew install libnfc`). Command-line, scriptable, the classic stack.
- **GoToTags Desktop App** (GUI, Windows-only really, but supports CSV-driven batch encoding — you give it a spreadsheet of URLs, it prompts you to tap tags in sequence and writes each one). Good for non-dev operations staff.
- **Node.js**: `nfc-pcsc` library. ~30 lines to write an NDEF URL record. Good if you want to build your own internal provisioning tool that talks to your backend ("give me the next unprogrammed table URL, write it, mark it provisioned").
- **Python**: `nfcpy` library, similar story.

For mzenas specifically, the Node route is probably the right long-term move — you'd build a tiny "provisioning mode" in the restaurant admin UI that talks to a USB reader and programs + locks tags in sequence while assigning them to table numbers in your DB.

**Option 3: pre-encoded tags from the supplier.** Shopnfc, GoToTags, and Seritag all offer "we'll program and lock your tags before shipping" as a paid service (~€0.10–0.20 extra per tag). You send a CSV of URLs, they ship you tags already written and locked. Useful once you have a real customer with 80 tables and you don't want to tap 80 stickers by hand.

### Concrete plan to try it this week

1. Order a pack of 10 NTAG213 stickers from Amazon (next-day) — ~€10.
2. Pick a real URL your app already handles, or spin up a throwaway page like `mzenas.app/t/test-table-1` that just shows "Table 1 — menu coming soon."
3. Install NFC Tools on your phone, write the URL to one tag, don't lock it yet.
4. Stick it under a coffee mug on your desk. Tap your phone, iPhone and any Android you can borrow. Verify the URL opens in-browser with no app prompt.
5. Test the failure modes you actually care about: phone in a case, phone with a magnetic wallet attached, tag stuck to a metal surface, tapping while the phone is locked vs. unlocked (iOS behaves differently).
6. Lock one tag with NFC Tools and confirm you can no longer overwrite it. This is the one security check that matters before any public deployment.
7. If you like the UX, order an ACR122U and script the provisioning flow in Node against `nfc-pcsc`.

Step 1–5 is a single evening once the tags arrive. That's enough to decide whether NFC earns its place on the table marker.

### One gotcha worth knowing upfront

iPhone's background tag reading only fires when the screen is **on and unlocked**. If a customer's phone is face-down on the table and locked, tapping does nothing — they have to wake it first. Android is more forgiving (unlocked is enough on most OEMs; a few require the screen on). Not a dealbreaker, but it means the table marker copy should say something like "Wake your phone and tap" rather than just "Tap to order," or your first-time users will think the tag is broken.
