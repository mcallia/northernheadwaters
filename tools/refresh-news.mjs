#!/usr/bin/env node
/**
 * Northern Headwaters news refresher — dependency-free, Node 18+.
 * Merges allied RSS + Google News searches into data/news.json.
 * On any feed failure, previously fetched entries for that category are kept.
 * Run: node tools/refresh-news.mjs
 *
 * EDITORIAL RULES (set July 2026 — mirror the campaign's register discipline):
 * 1. BLOCKED_SOURCES are never shown. biggestwildest.ca and its releases use a
 *    southern-wilderness register the campaign explicitly avoids; opinion mills
 *    that platform anti-conservancy framing (Western Standard) are dropped too.
 *    Mainstream coverage of the same topics still appears via the news search.
 * 2. Allied-org feeds (cat "coalition") are capped at ONE visible item per
 *    organization per refresh — never a wall of one org's releases.
 * 3. Coalition items must be recognizably northern (NORTHERN_TERMS check on the
 *    title) — general-wildlife or south-coast releases are skipped.
 * 4. Opponent opinion is never surfaced (OPINION_GENRE + ADVERSARIAL). We report
 *    news; we don't hand the other side's op-eds a platform. This drops opinion/
 *    op-ed/editorial/commentary pieces from the news search AND anything whose
 *    headline argues the "land grab / locked out / kills jobs" line. Applies to
 *    media results only. To feature a FAVOURABLE column, hand-add it to
 *    data/news.json as {"cat":"campaign", ...} — campaign entries are preserved.
 */
import { readFileSync, writeFileSync } from "node:fs";

const NEWS_PATH = new URL("../data/news.json", import.meta.url);
const RSS_FEEDS = [
  ["coalition", "SkeenaWild", "https://skeenawild.org/feed/"],
  ["coalition", "Tahltan Central Government", "https://tahltan.org/feed/"],
  ["coalition", "The Skeena", "https://theskeena.com/feed/"],
];
const GNEWS_QUERY = '("Sacred Headwaters" OR Klappan OR Meziadin OR "Dene K\'eh Kusan" OR "Golden Triangle" OR "Red Chris" OR "Galore Creek" OR "Stikine" OR "Nass River" OR "Taku River" OR "Kaska Dena") "British Columbia"';
const UA = { headers: { "User-Agent": "northernheadwaters-site/1.0 (+https://github.com/mcallia/northernheadwaters)" } };

const BLOCKED_SOURCES = [/biggest\s*wildest/i, /western\s*standard/i];
const BLOCKED_URLS = [/biggestwildest\.ca/i, /westernstandard\.news/i];
const COALITION_CAP = 1;
const NORTHERN_TERMS = /skeena|nass|stikine|taku|liard|klappan|meziadin|kaska|kechika|headwater|salmon|steelhead|moose|caribou|dease|iskut|telegraph creek|atlin|tahltan|gitanyow|gitxsan|nisga|tlingit|tsetsaut|conservanc|protected area|ipca|golden triangle|smithers|terrace|hazelton|stewart|dease lake|good hope lake|lower post|red chris|eskay|ksm|galore|schaft|turnagain|kutcho|tulsequah|cassiar/i;

const blocked = (it) =>
  BLOCKED_SOURCES.some((r) => r.test(it.source || "")) ||
  BLOCKED_URLS.some((r) => r.test(it.url || ""));

// Rule 4 — opponent opinion. Genre tells plus explicit anti-campaign framings.
const OPINION_GENRE = /(^|[|:–-]\s*)(opinion|op[-\s]?ed|editorial|commentary)\b|\b(opinion|op[-\s]?ed)\s*:/i;
const ADVERSARIAL = [
  /land\s*grab/i,
  /lock(ing|ed|s)?\s*(up|out|away)\s*(the\s*)?(land|north|backcountry)/i,
  /kill(s|ing)?\s+(mining\s+)?jobs/i,
  /war\s+on\s+(mining|resource)/i,
  /veto\s+over\s+crown\s+land/i,
  /cannot\s+coexist/i,
];
const isOpinion = (t) => OPINION_GENRE.test(t) || ADVERSARIAL.some((r) => r.test(t));

function decode(s) {
  return (s || "")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/<[^>]+>/g, "").trim();
}

async function fetchText(url) {
  const r = await fetch(url, UA);
  if (!r.ok) throw new Error(r.status + " " + url);
  return await r.text();
}

function parseRss(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/g)) {
    const b = m[1];
    const g = (tag) => (b.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">")) || [])[1] || "";
    const src = decode(g("source"));
    let title = decode(g("title"));
    if (src && title.endsWith(" - " + src)) title = title.slice(0, -(" - " + src).length);
    const d = new Date(decode(g("pubDate")));
    items.push({
      title,
      url: decode(g("link")),
      source: src,
      date: isNaN(d) ? "" : d.toISOString().slice(0, 10),
    });
  }
  return items;
}

async function main() {
  let prev = { items: [] };
  try { prev = JSON.parse(readFileSync(NEWS_PATH, "utf8")); } catch {}
  const keep = (cat) => prev.items.filter((i) => i.cat === cat);

  // Campaign entries are hand-curated — always preserved.
  const campaign = keep("campaign");

  // Allied feeds
  let coalition = [];
  for (const [cat, name, feed] of RSS_FEEDS) {
    try {
      const items = parseRss(await fetchText(feed))
        .filter((i) => i.title && i.url && !blocked(i))
        .filter((i) => NORTHERN_TERMS.test(i.title))
        .slice(0, COALITION_CAP)
        .map((i) => ({ cat, source: name, title: i.title, url: i.url, date: i.date }));
      coalition.push(...items);
    } catch (e) {
      console.error("feed failed, keeping previous:", name, e.message);
      coalition.push(...keep("coalition").filter((i) => i.source === name));
    }
  }

  // News search
  let media = [];
  try {
    const url = "https://news.google.com/rss/search?q=" + encodeURIComponent(GNEWS_QUERY) + "&hl=en-CA&gl=CA&ceid=CA:en";
    media = parseRss(await fetchText(url))
      .filter((i) => i.title && i.url && !blocked(i) && !isOpinion(i.title))
      .slice(0, 25)
      .map((i) => ({ cat: "media", source: i.source || "News", title: i.title, url: i.url, date: i.date }));
  } catch (e) {
    console.error("news search failed, keeping previous:", e.message);
    media = keep("media");
  }

  const seen = new Set();
  const items = [...campaign, ...coalition, ...media]
    .filter((i) => { const k = i.url; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 40);

  writeFileSync(NEWS_PATH, JSON.stringify({ updated: new Date().toISOString(), items }, null, 1) + "\n");
  console.log("wrote", items.length, "items");
}

main().catch((e) => { console.error(e); process.exit(1); });
