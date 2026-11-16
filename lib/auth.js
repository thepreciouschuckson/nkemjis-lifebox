import { createHmac, timingSafeEqual } from "node:crypto";

const DAY = 86400;
const sign = (v) => createHmac("sha256", process.env.SESSION_SECRET).update(v).digest("hex");
const safeEq = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

export const checkPassword = (p) => !!process.env.LIFEBOX_PASSWORD && safeEq(p || "", process.env.LIFEBOX_PASSWORD);

export function makeCookie(req) {
  const exp = Math.floor(Date.now() / 1000) + 30 * DAY;
  const local = /^(localhost|127\.0\.0\.1)/.test(req.headers.host || "");
  return `lb=${exp}.${sign(String(exp))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${30 * DAY}${local ? "" : "; Secure"}`;
}

// Accepts the login cookie (the app) or a bearer token (the iPhone Shortcut).
export function isAuthed(req) {
  const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (bearer && process.env.SHORTCUT_TOKEN && safeEq(bearer, process.env.SHORTCUT_TOKEN)) return true;
  const m = (req.headers.cookie || "").match(/(?:^|;\s*)lb=([^;]+)/);
  if (!m) return false;
  const [exp, sig] = m[1].split(".");
  return !!sig && Number(exp) > Date.now() / 1000 && safeEq(sig, sign(exp));
}
