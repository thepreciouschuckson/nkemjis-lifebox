import { isAuthed } from "../lib/auth.js";
import { putImage } from "../lib/r2.js";

export default async function handler(req, res) {
  try {
    if (!isAuthed(req)) return res.status(401).json({ error: "Not signed in" });
    if (req.method !== "POST") return res.status(405).end();
    const type = String(req.headers["x-image-type"] || "");
    const body = req.body;
    if (!Buffer.isBuffer(body) || !body.length) return res.status(400).json({ error: "No image received" });
    if (body.length > 4_000_000) return res.status(413).json({ error: "Image too large" });
    const url = await putImage(body, type);
    return res.status(201).json({ url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Upload failed" });
  }
}
