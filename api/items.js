import { sql, toItem } from "../lib/db.js";
import { isAuthed } from "../lib/auth.js";

export default async function handler(req, res) {
  try {
    if (!isAuthed(req)) return res.status(401).json({ error: "Not signed in" });

    if (req.method === "GET") {
      const rows = await sql`select * from items order by created_at desc`;
      return res.status(200).json(rows.map(toItem));
    }

    if (req.method === "POST") {
      const b = req.body || {};
      const title = (b.title || b.link || "").trim();
      if (!title) return res.status(400).json({ error: "A title or link is required" });
      const rows = await sql`
        insert into items (title, category, link, image, notes, tags, status, extra)
        values (${title}, ${b.category || "random"}, ${b.link || ""}, ${b.image || ""}, ${b.notes || ""},
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
