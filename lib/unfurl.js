// Fetches a page title and cover image for a saved link.
const BLOCKED = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1)/;
const UA = "Mozilla/5.0 (compatible; LifeBoxBot/1.0)";
const MAX_TITLE = 80;

const decode = (s = "") =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

function shorten(s) {
  if (s.length <= MAX_TITLE) return s;
  const cut = s.slice(0, MAX_TITLE).replace(/\s+\S*$/, "");
  return (cut || s.slice(0, MAX_TITLE)) + "…";
}

function meta(html, key) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const name = (tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (name && name.toLowerCase() === key) {
      const c = (tag.match(/content\s*=\s*"([^"]*)"/i) || tag.match(/content\s*=\s*'([^']*)'/i) || [])[1];
      if (c) return decode(c);
    }
  }
  return "";
}

// Returns a short title, a cover image, and the full text when the title had to be cut.
export async function unfurl(link) {
  const out = { title: "", image: "", text: "" };
  let url;
  try { url = new URL(link); } catch { return out; }
  if (!/^https?:$/.test(url.protocol) || BLOCKED.test(url.hostname)) return out;

  let raw = "";
  try {
    if (/(^|\.)tiktok\.com$/.test(url.hostname)) {
      // Short links redirect to the full video page, and oEmbed needs the full address.
      const page = await fetch(url.href, { redirect: "follow", signal: AbortSignal.timeout(3000), headers: { "User-Agent": UA } });
      const full = new URL(page.url);
      const r = await fetch("https://www.tiktok.com/oembed?url=" + encodeURIComponent(full.origin + full.pathname), { signal: AbortSignal.timeout(3000) });
      if (r.ok) {
        const j = await r.json();
        raw = decode(j.title || "");
        out.image = j.thumbnail_url || "";
      }
    } else {
      const r = await fetch(url.href, { redirect: "follow", signal: AbortSignal.timeout(4000), headers: { "User-Agent": UA, Accept: "text/html" } });
      const html = (await r.text()).slice(0, 200000);
      raw = meta(html, "og:title") || meta(html, "twitter:title") || decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
      const img = meta(html, "og:image") || meta(html, "twitter:image");
      if (img) out.image = new URL(img, r.url || url.href).href;
    }
  } catch {}

  if (out.image) out.image = out.image.replace(/^http:/, "https:");
  if (raw.length > MAX_TITLE) out.text = raw;
  out.title = shorten(raw);
  return out;
}
