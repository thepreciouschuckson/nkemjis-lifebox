// Fetches a page title and cover image for a saved link.
const BLOCKED = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1)/;

const decode = (s = "") =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

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

export async function unfurl(link) {
  const out = { title: "", image: "" };
  let url;
  try { url = new URL(link); } catch { return out; }
  if (!/^https?:$/.test(url.protocol) || BLOCKED.test(url.hostname)) return out;

  try {
    if (/(^|\.)tiktok\.com$/.test(url.hostname)) {
      const r = await fetch("https://www.tiktok.com/oembed?url=" + encodeURIComponent(url.href), { signal: AbortSignal.timeout(4000) });
      if (r.ok) {
        const j = await r.json();
        out.title = decode(j.title || "");
        out.image = j.thumbnail_url || "";
      }
      if (out.title) return out;
    }
    const r = await fetch(url.href, {
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LifeBoxBot/1.0)", Accept: "text/html" },
    });
    const html = (await r.text()).slice(0, 200000);
    out.title = meta(html, "og:title") || meta(html, "twitter:title") || decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
    const img = meta(html, "og:image") || meta(html, "twitter:image");
    if (img) out.image = new URL(img, r.url || url.href).href;
  } catch {}
  return out;
}
