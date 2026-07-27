#!/usr/bin/env python3
"""Northern Headwaters static site builder.

Stitches tools/pages/*.html bodies into the shared shell and writes plain HTML
to the repo root. Each body starts with:  <!--META {json} -->
META keys: title, desc, nav, og, css (list), js (list), bodyclass, gate ("skip"
to emit the file raw with no shell — used by the password gate page).

Usage: python3 tools/build.py
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / "tools" / "pages"
BASE = "https://mcallia.github.io/northernheadwaters/"
SITE_NAME = "Northern Headwaters"
NAV = [
    ("home", "home.html", "Home"),
    ("case", "the-case.html", "The Case"),
    ("plan", "the-plan.html", "The Plan"),
    ("live", "headwaters-live.html", "Headwaters LIVE"),
    ("explainers", "explainers.html", "Explainers"),
    ("humans", "humans.html", "Humans"),
    ("news", "newsroom.html", "Newsroom"),
]

def nav_html(current):
    out = []
    for key, href, label in NAV:
        cur = ' aria-current="page"' if key == current else ""
        out.append(f'<a href="{href}"{cur}>{label}</a>')
    out.append('<a class="nav-cta" href="take-action.html">Take Action</a>')
    return "\n      ".join(out)

HEAD = """<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="js/gate.js"></script>
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="noindex,nofollow">
<meta property="og:site_name" content="{site}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{base}img/{og}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{canonical}">
<meta name="theme-color" content="#0e2237">
<link rel="icon" type="image/png" sizes="32x32" href="img/favicon-32.png">
<link rel="apple-touch-icon" href="img/favicon-180.png">
<link rel="preload" href="fonts/BarlowCondensed-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/fonts.css">
<link rel="stylesheet" href="css/site.css">
{extra_css}
</head>
<body class="{bodyclass}">
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><div class="header-bar">
  <a class="brand" href="home.html"><img src="img/logo.png" alt="Northern Headwaters" height="46"></a>
  <nav class="nav-desktop" aria-label="Primary">
      {nav}
  </nav>
  <button class="nav-toggle" aria-expanded="false" aria-controls="mnav" aria-label="Open menu"><span></span><span></span><span></span></button>
</div></header>
<nav class="nav-mobile" id="mnav" aria-label="Mobile">
      {nav}
</nav>
<main id="main">
"""

FOOTER = """</main>
<footer class="site-footer">
  <div class="container foot-grid">
    <div class="foot-brand">
      <img src="img/logo.png" alt="Northern Headwaters" height="52">
      <p class="foot-tag">PROTECT THE SOURCE. KEEP THE COUNTRY OPEN.</p>
      <p>The vast and mountainous expanse of northern British Columbia is home to some of the most important headwaters on the continent — the Skeena, the Nass, the Stikine, the Taku, and the Liard. Northern Headwaters is a common-sense effort to protect these living systems while keeping the country open, the water clean, and the jobs long-lasting.</p>
      <p class="foot-proto">Review prototype &mdash; not the live northernheadwaters.ca</p>
    </div>
    <nav class="foot-col" aria-label="Explore">
      <h3>Explore</h3>
      <a href="the-case.html">The Case</a>
      <a href="the-plan.html">The Plan</a>
      <a href="headwaters-live.html">Headwaters LIVE</a>
      <a href="explainers.html">Explainers</a>
      <a href="humans.html">Humans of the North</a>
      <a href="newsroom.html">Newsroom</a>
      <a href="resources.html">Resources &amp; Organizations</a>
      <a href="swag.html">Swag</a>
      <a href="about.html">About</a>
    </nav>
    <nav class="foot-col" aria-label="Act">
      <h3>Act</h3>
      <a href="take-action.html">Take Action</a>
      <a href="https://gonorthernheadwaters.ca/" rel="noopener">Comment on the 3 protected areas</a>
      <a href="https://buy.stripe.com/cNiaEQ8I21cccySbRo9MY00" rel="noopener">Donate</a>
      <a href="swag.html">Wear the North</a>
    </nav>
    <div class="foot-col">
      <h3>Contact</h3>
      <a href="mailto:info@northernheadwaters.ca">info@northernheadwaters.ca</a>
      <p>3556 Second Avenue<br>Smithers, BC<br>+1 867-467-7575</p>
      <div class="foot-social">
        <a href="https://www.facebook.com/NorthernHeadwatersBC" rel="noopener">Facebook</a>
        <a href="https://www.instagram.com/northernheadwatersbc/" rel="noopener">Instagram</a>
      </div>
    </div>
  </div>
  <div class="container foot-base">
    <span>&copy; <span data-year>2026</span> Northern Headwaters Initiative &middot; a project of the <a href="https://stronglivelihoods.ca/" rel="noopener">Strong Livelihoods Society</a></span>
    <span><a href="about.html#credits">Photo &amp; data credits</a></span>
  </div>
</footer>
<script src="js/site.js"></script>
{extra_js}
</body>
</html>
"""

def build():
    for body_file in sorted(PAGES.glob("*.html")):
        raw = body_file.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--META\s*(\{.*?\})\s*-->", raw, re.S)
        meta = json.loads(m.group(1)) if m else {}
        body = raw[m.end():] if m else raw
        if meta.get("gate") == "skip":
            (ROOT / body_file.name).write_text(body.strip() + "\n", encoding="utf-8")
            print("built (raw)", body_file.name)
            continue
        canonical = BASE + ("" if body_file.name == "index.html" else body_file.name)
        head = HEAD.format(
            title=meta.get("title", SITE_NAME),
            desc=meta.get("desc", "").replace('"', "&quot;"),
            site=SITE_NAME, base=BASE, canonical=canonical,
            og=meta.get("og", "og-share.jpg"),
            bodyclass=meta.get("bodyclass", ""),
            nav=nav_html(meta.get("nav", "")),
            extra_css="\n".join(f'<link rel="stylesheet" href="{c}">' for c in meta.get("css", [])),
        )
        footer = FOOTER.format(
            extra_js="\n".join(f'<script src="{j}"></script>' for j in meta.get("js", [])))
        (ROOT / body_file.name).write_text(head + body.strip() + "\n" + footer, encoding="utf-8")
        print("built", body_file.name)

if __name__ == "__main__":
    build()
