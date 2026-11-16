import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL);

export const toItem = (r) => ({
  id: r.id, title: r.title, category: r.category, link: r.link, image: r.image,
  notes: r.notes, tags: r.tags || [], status: r.status, extra: r.extra || {},
  createdAt: r.created_at, updatedAt: r.updated_at,
});
