import { getImage } from "../../lib/r2.js";
import { isAuthed } from "../../lib/auth.js";

export default async function handler(req, res) {
  try {
    if (!isAuthed(req)) return res.status(401).end();
    const { name } = req.query;
    if (!/^[\w-]+\.(jpg|png|webp|gif)$/.test(name)) return res.status(400).end();
    const obj = await getImage(name);
    const bytes = await obj.Body.transformToByteArray();
    res.setHeader("Content-Type", obj.ContentType || "image/jpeg");
    res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
    return res.status(200).send(Buffer.from(bytes));
  } catch (e) {
    if (e.name === "NoSuchKey") return res.status(404).end();
    console.error(e);
    res.status(500).end();
  }
}
