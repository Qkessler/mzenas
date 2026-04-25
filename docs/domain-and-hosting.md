# Domain and Hosting

Mzenas serves its public landing page at **https://mzenas.com** from GitHub Pages, with a Let's Encrypt TLS certificate that GitHub provisions and renews automatically. The page is a branded "Próximamente" (work-in-progress) screen that introduces the product while the full platform is under construction. The four interactive prototypes (`customer-flow.html`, `restaurant-kitchen.html`, `restaurant-operations.html`, `ai-onboarding.html`) remain in the repository but are not linked from the landing page, so they stay reachable for demos only if you know the URL.

The setup costs nothing beyond the domain itself. GitHub Pages is free for public repositories, Let's Encrypt certificates are free, and Namecheap's DNS is included with the domain registration. The total recurring cost is the annual `.com` renewal.

## Architecture at a glance

Traffic flows from the user's browser to Namecheap's authoritative nameservers for DNS resolution, then to GitHub's edge servers, which serve the static HTML from the `main` branch of the `Qkessler/mzenas` repository. GitHub terminates TLS at its edge using a Let's Encrypt certificate issued for `mzenas.com` and `www.mzenas.com`. Both the `www` subdomain and plain HTTP requests 301-redirect to `https://mzenas.com/`.

| Layer | Provider | What it does |
|---|---|---|
| Domain registrar | Namecheap | Owns the `mzenas.com` registration and hosts DNS |
| DNS | Namecheap (`dns1/dns2.registrar-servers.com`) | Resolves `mzenas.com` and `www.mzenas.com` to GitHub's IPs |
| Hosting | GitHub Pages (`Qkessler/mzenas`, `main`, `/`) | Serves the static site |
| TLS | Let's Encrypt (via GitHub) | Issues and auto-renews the certificate |

## DNS configuration

At Namecheap, the Advanced DNS tab holds five records. Four `A` records on host `@` point the apex `mzenas.com` to GitHub Pages' four anycast IPs (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`). A single `CNAME` record on host `www` points `www.mzenas.com` to `qkessler.github.io.` (the trailing dot is required by Namecheap's form). We deleted Namecheap's default parking `CNAME` and any URL Redirect record during setup, because both would have intercepted traffic before it reached GitHub.

GitHub identifies the correct repository to serve for incoming requests by reading the `CNAME` file at the repo root, which contains the single line `mzenas.com`. This file is what makes the custom domain "stick" through rebuilds. If you ever delete it, GitHub Pages reverts to serving from `qkessler.github.io/mzenas` and the custom domain unbinds.

## TLS and HTTPS enforcement

GitHub requested the Let's Encrypt certificate automatically once DNS resolved correctly. The certificate covers both `mzenas.com` and `www.mzenas.com` as Subject Alternative Names, is issued by Let's Encrypt's R13 intermediate, and renews roughly 30 days before expiry without any manual intervention. The repository settings have "Enforce HTTPS" enabled, so `http://` requests receive a 301 to the HTTPS equivalent. SSL Labs grades the endpoint **A** across all four GitHub IPs.

During setup the certificate stuck in a pending state for about 15 minutes. Toggling the custom domain off and back on via the Pages API (`gh api -X PUT repos/Qkessler/mzenas/pages -f cname=""` followed by the same call with `cname=mzenas.com`) nudged GitHub to issue it immediately. If you ever hit the same issue, repeat that toggle.

## Deploying changes

Every push to `main` redeploys the site in roughly 30 to 60 seconds. The workflow is:

```
cd /Users/enrikes/Documents/mzenas
# edit index.html (or add new files at the repo root)
git add -A
git commit -m "Update landing page"
git push origin main
```

The git remote uses HTTPS (`https://github.com/Qkessler/mzenas.git`) with `gh auth` wired in as the credential helper. This sidesteps the original SSH push failure we hit during setup, where the local SSH key was not registered on GitHub. If you later add the SSH key to GitHub and prefer SSH, switch the remote back with `git remote set-url origin git@github.com:Qkessler/mzenas.git`.

The landing page itself lives at `/index.html`. It uses the Mzenas design system (Inter font, `#C0392B` brand red accent with `#7B3F00` brown as the secondary color, 12px card radius), pulls the hero logo from `assets/mzenas-logo-vertical.png` and the share image from `assets/mzenas-logo-principal.png`, and includes Open Graph and Twitter Card tags for link previews. See `assets/README.md` for the full asset inventory. Contact email is `info@mzenas.com`, which requires Namecheap's free email forwarding to be configured on the Domain tab so messages actually route to a real inbox.

## Why GitHub Pages and not a VPS

A VPS with nginx and `certbot` would have given us more control and the ability to run server-side code, but nothing on the current landing page needs either. GitHub Pages eliminates three operational burdens we would otherwise own: renewing the TLS certificate every 90 days, patching the server OS, and monitoring uptime. It also gives us a global CDN (Fastly) for free. If we later need server-side logic, email capture with a backend, or a database, we will move to a small VPS or a platform like Fly.io or Railway at that point, and repoint the DNS. The Namecheap-side configuration is the only thing that needs to change when we migrate, because GitHub's IPs and `qkessler.github.io` would be replaced with whatever the new host dictates.

## History

The repository was already public on GitHub at `Qkessler/mzenas` before today. We added `index.html` and the `CNAME` file, pushed them to `main`, configured the five Namecheap DNS records, and let GitHub handle the rest. Global DNS propagated within a few minutes across major public resolvers (Cloudflare, Google, Quad9, OpenDNS, Level3), though the local ISP resolver held a stale Namecheap parking IP (`162.255.119.153`) for roughly 15 minutes before refreshing. The certificate issued immediately after we nudged the Pages API, and the site has been live at `https://mzenas.com` since.
