import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});
const Bucket = process.env.R2_BUCKET;
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export async function putImage(body, type) {
  const ext = EXT[type];
  if (!ext) throw new Error("Unsupported image type");
  const name = `${randomUUID()}.${ext}`;
  await client.send(new PutObjectCommand({ Bucket, Key: `img/${name}`, Body: body, ContentType: type }));
  return `/api/img/${name}`;
}

export const getImage = (name) => client.send(new GetObjectCommand({ Bucket, Key: `img/${name}` }));

export async function removeImage(path) {
  const m = /^\/api\/img\/([\w-]+\.\w+)$/.exec(path || "");
  if (m) await client.send(new DeleteObjectCommand({ Bucket, Key: `img/${m[1]}` }));
}

// Copies an outside image into your own storage so it never expires or gets blocked.
export async function copyRemoteImage(url) {
  try {
    if (!/^https:\/\//.test(url)) return url;
    const r = await fetch(url, { signal: AbortSignal.timeout(4000), headers: { "User-Agent": "Mozilla/5.0 (compatible; LifeBoxBot/1.0)" } });
    const type = (r.headers.get("content-type") || "").split(";")[0].trim();
    if (!r.ok || !EXT[type]) return url;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 5_000_000) return url;
    return await putImage(buf, type);
  } catch {
    return url;
  }
}
