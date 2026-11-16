import { sql, toItem } from "../../lib/db.js";
import { isAuthed } from "../../lib/auth.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  try {
    if (!isAuthed(req)) return res.status(401).json({ error: "Not signed in" });
    const { id } = req.query;
    if (!UUID.test(id)) return res.status(400).json({ error: "Bad id" });

    if (req.method === "PUT") {
      const b = req.body || {};
      const title = (b.title || "").trim();
      if (!title) return res.status(400).json({ error: "A title is required" });
      const rows = await sql`
        update items set title = ${title}, category = ${b.category || "random"}, link = ${b.link || ""},
          image = ${b.image || ""}, notes = ${b.notes || ""}, tags = ${b.tags || []}::text[],
          status = ${b.status || "want"}, extra = ${JSON.stringify(b.extra || {})}::jsonb, updated_at = now()
        where id = ${id} returning *`;
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(toItem(rows[0]));
    }

    if (req.method === "DELETE") {
      await sql`delete from items where id = ${id}`;
      return res.status(204).end();
    }

    res.status(405).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}
