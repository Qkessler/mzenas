# QR codes

The QR code that the AI onboarding demo hands the restaurant at go-live (`assets/qr-customer-flow.svg`) is a static SVG checked into the repo. It points at `https://mzenas.com/customer-flow.html`, so scanning it from a phone drops the visitor into the diner-side demo — the same place a real customer would land after scanning a table QR in production. Regenerate it whenever the customer-flow URL changes, and otherwise leave it alone.

## How it was generated

We use [qrrs](https://github.com/nikitapriboi/qrrs), a small Rust CLI, installed once with `cargo install --locked qrrs`. From the repo root:

```
qrrs -m 2 -o svg "https://mzenas.com/customer-flow.html" assets/qr-customer-flow.svg
```

The `-o svg` flag makes qrrs emit SVG instead of its default PNG, which keeps the QR crisp at any size the onboarding UI renders it. `-m 2` trims the quiet-zone margin from the default 5 modules down to 2 — still safely above the 4-module minimum the spec recommends for scanners, but tight enough that the QR fills the card in the demo without extra CSS cropping. The final positional argument is the output path; omit it and qrrs writes to stdout instead.

## Verifying the payload

To confirm what a checked-in QR actually encodes, ask qrrs to read it back:

```
qrrs --read assets/qr-customer-flow.svg
```

It should print `https://mzenas.com/customer-flow.html`. If it prints anything else, the SVG was regenerated with the wrong argument and needs to be redone.
