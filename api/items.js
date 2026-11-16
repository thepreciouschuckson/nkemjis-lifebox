import { sql, toItem } from "../lib/db.js";
import { isAuthed } from "../lib/auth.js";
import { unfurl } from "../lib/unfurl.js";

export default async function handler(req, res) {
  try {
    if (!isAuthed(req)) return res.status(401).json({ error: "Not signed in" });

    if (req.method === "GET") {
      const rows = await sql`select * from items order by created_at desc`;
      return res.status(200).json(rows.map(toItem));
    }

    if (req.method === "POST") {
      const b = req.body || {};
      const link = (b.link || "").trim();
      let title = (b.title || "").trim();
      let image = (b.image || "").trim();
      if (!title && !link) return res.status(400).json({ error: "A title or link is required" });
      if (link && (!title || !image)) {
        const found = await unfurl(link);
        title = title || found.title.slice(0, 200) || link;
        image = image || found.image;
      }
      const rows = await sql`
        insert into items (title, category, link, image, notes, tags, status, extra)
        values (${title}, ${b.category || "random"}, ${link}, ${image}, ${b.notes || ""},
                ${b.tags || []}::text[], ${b.status || "want"}, ${JSON.stringify(b.extra || {})}::jsonb)
        returning *`;
      return res.status(201).json(toItem(rows[0]));
    }

    res.status(405).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}
