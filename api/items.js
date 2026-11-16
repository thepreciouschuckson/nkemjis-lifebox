import { waitUntil } from "@vercel/functions";
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
      const title = (b.title || "").trim();
      const image = (b.image || "").trim();
      if (!title && !link) return res.status(400).json({ error: "A title or link is required" });

      // Save right away so the Shortcut gets a fast reply.
      const rows = await sql`
        insert into items (title, category, link, image, notes, tags, status, extra)
        values (${title || link}, ${b.category || "random"}, ${link}, ${image}, ${b.notes || ""},
                ${b.tags || []}::text[], ${b.status || "want"}, ${JSON.stringify(b.extra || {})}::jsonb)
        returning *`;
      const item = rows[0];

      // Then look up the real title and cover image in the background.
      if (link && (!title || !image)) {
        waitUntil((async () => {
          const found = await unfurl(link);
          const newTitle = found.title || null;
          const newText = found.text || null;
          const newImage = found.image || null;
          if (!newTitle && !newImage) return;
          await sql`
            update items set
              title = case when title = link then coalesce(${newTitle}::text, title) else title end,
              notes = case when notes = '' and title = link then coalesce(${newText}::text, notes) else notes end,
              image = case when image = '' then coalesce(${newImage}::text, image) else image end,
              updated_at = now()
            where id = ${item.id}`;
        })().catch((e) => console.error(e)));
      }

      return res.status(201).json(toItem(item));
    }

    res.status(405).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}
