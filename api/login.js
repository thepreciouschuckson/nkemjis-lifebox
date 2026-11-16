import { checkPassword, makeCookie, isAuthed } from "../lib/auth.js";

export default function handler(req, res) {
  try {
    if (req.method === "GET") {
      const ok = isAuthed(req);
      return res.status(ok ? 200 : 401).json({ ok });
    }
    if (req.method === "POST") {
      if (!checkPassword(req.body?.password)) return res.status(401).json({ ok: false });
      res.setHeader("Set-Cookie", makeCookie(req));
      return res.status(200).json({ ok: true });
    }
    res.status(405).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}
