# Northern Headwaters — site redesign prototype

Password-gated review prototype of a redesigned **northernheadwaters.ca**, built as static,
dependency-light HTML for GitHub Pages.

**Live preview:** https://mcallia.github.io/northernheadwaters/ (password required — ask Angus)

## How it's put together

- Every page is plain HTML in the repo root — any host can serve it, anyone can hand-edit it.
- Page *bodies* live in `tools/pages/*.html` with a small JSON `<!--META-->` header
  (title, description, nav key, extra css/js). `tools/build.py` stitches each body into the
  shared shell (head, header/nav, footer) and writes the root HTML files.
- **Edit workflow:** change a file in `tools/pages/`, run `python tools/build.py`, commit, push.
  (Editing the root HTML directly also works — just know a later build overwrites it.)
- `main` is the working branch; GitHub Pages serves the `gh-pages` branch. The news workflow
  mirrors `main → gh-pages` on every run (every 6 h), or push manually:
  `git push origin main:gh-pages --force`.

## What's where

| Path | What |
|---|---|
| `index.html` | Password gate (client-side SHA-256; sessionStorage). Not real security — review privacy only. |
| `home.html` … `404.html` | The site (gated by `js/gate.js` in the shared shell) |
| `css/site.css` | Design system — brand tokens from the NHI badge + 2026 Narrative Branding Strategy |
| `css/fonts.css` + `fonts/` | Self-hosted Barlow Condensed / Barlow / IBM Plex Mono |
| `js/live-tiles.js` | Live river gauges (Water Survey of Canada + USGS Taku), weather (Open-Meteo), and the Aug 4 countdown — keyless, CORS-open, fail-soft |
| `js/maps.js` | The Plan map + The Case mines map (Leaflet, vendored) |
| `js/cams.js` | DriveBC Highway 37 camera refresher |
| `data/protected-areas.geojson` | Parks + conservancies, BC Data Catalogue (Tantalis), simplified; retrieved Jul 2026 |
| `data/proposals.json` | The three proposals **status board** — see review cadence below |
| `data/mines.json` | The mines ledger — every row carries stage, owner, watershed, and a public source |
| `data/news.json` | Newsroom feed — refreshed by `.github/workflows/news.yml` every 6 h |
| `tools/refresh-news.mjs` | The refresher: allied RSS + Google News search, with the campaign's editorial filters |
| `video/` | Web-compressed campaign videos (originals live in Dropbox / the G: drive DAM) |
| `img/` | Campaign photography + `SAMPLE ONLY` placeholders (see below) |

## Review cadence (the site's freshness contract)

- **`data/proposals.json` (The Plan status board): weekly** while comment windows are open,
  monthly after. Update the `updated` date and the on-page "current to" date in
  `tools/pages/the-plan.html` together. New protected-area announcements get added here.
- **`data/mines.json` (The Case ledger): monthly**, or when a project changes stage.
  Every change needs a public source URL in the row.
- **`data/news.json`:** automatic (workflow, every 6 h). Hand-add favourable columns as
  `{"cat":"campaign", ...}` entries — the refresher preserves them.
- **Highway cams (`js/cams.js`):** Meziadin Junction (cam 256) was offline at build time —
  swap it back in when DriveBC restores it.
- **Humans of the North:** new portraits → compress with the ffmpeg one-liner below, drop the
  mp4 + poster jpg + vtt in place, add a `hotn-card` block in `tools/pages/humans.html`, rebuild.

```
ffmpeg -i IN.mp4 -vf "scale=w=1280:h=1280:force_original_aspect_ratio=decrease:force_divisible_by=2" \
  -c:v libx264 -crf 27 -preset fast -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart OUT.mp4
```

## Sample imagery

Placeholder and borrowed images are watermarked **SAMPLE ONLY** and carry reference IDs
(`NHI_Image1` … `NHI_Image10`, `NHI_Swag1-4`) so they're easy to find and replace. Search the
page bodies for the ID, drop the licensed replacement in `img/`, update the `<img>` and the
credit line in `about.html`. The full campaign image library: `1 NHI CAMPAIGN\IMAGES\` (Dropbox)
and the ~55 GB `NHI Project.zip` archive (OneDrive).

## Register discipline (do not break these)

- Lead with water, salmon, and tangible material benefit. Not climate. Not "wilderness".
- Banned words in our own copy: wild / wildness / wilderness / pristine.
- Mineral tenures: say they "would be retired" — nothing about compensation mechanisms.
- Every statistic carries a named public source (The Case → Sources; About → credits).
- Newsroom filters (see `tools/refresh-news.mjs` header): no biggestwildest, no opponent op-eds,
  allied orgs capped at one item per refresh.
- Known open flag for the team: the campaign has published **$1.28T** (BC Geological Survey);
  the Washington Post graphic sourced to the same survey says **$1T**. The Case says
  "$1 trillion or more" pending reconciliation — flagged inline on the page.

## Changing the password

The gate compares a SHA-256 hash in `tools/pages/index.html`. To change it:
`python -c "import hashlib;print(hashlib.sha256('newpassword'.encode()).hexdigest())"`,
paste the hash into the `HASH` constant, rebuild, push. (Password is lower-cased before hashing.)
Current password: ask Angus (set July 2026).

## Going live for real (later)

This prototype ships with `noindex` metatags, `robots.txt` disallow, and the password gate.
A real launch would remove those three things, point the northernheadwaters.ca domain,
swap `BASE` in `tools/build.py`, replace all `SAMPLE ONLY` imagery, resolve every
`DRAFT` flag (issues briefs, $1.28T vs $1T, Ascot status), and move video hosting to YouTube
embeds once the channel is up.
