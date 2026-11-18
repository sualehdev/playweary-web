/**
 * Called by the Playweary API after a price or stock change, so the site
 * shows it on the very next request.
 *
 * Signed with HMAC-SHA256 over `${timestamp}.${rawBody}` using REVALIDATE_SECRET
 * (shared with the API). Requests older than 5 minutes are refused so a captured
 * request can't be replayed later. Only whitelisted tags can be expired.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog";

const ALLOWED_TAGS = new Set([CATALOG_TAG]);
const MAX_SKEW_MS = 5 * 60_000;

const deny = (status: number, message: string) => Response.json({ ok: false, message }, { status });

function validSignature(secret: string, ts: string, body: string, signature: string) {
  const expected = createHmac("sha256", secret).update(`${ts}.${body}`).digest();
  let given: Buffer;
  try {
    given = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return deny(503, "Revalidation is not configured");

  const ts = request.headers.get("x-playweary-timestamp") ?? "";
  const signature = request.headers.get("x-playweary-signature") ?? "";
  const body = await request.text();
  if (body.length > 2048) return deny(413, "Payload too large");

  const sent = Number(ts);
  if (!Number.isFinite(sent) || Math.abs(Date.now() - sent) > MAX_SKEW_MS) return deny(401, "Stale or missing timestamp");
  if (!validSignature(secret, ts, body, signature)) return deny(401, "Bad signature");

  let tags: unknown;
  try {
    tags = (JSON.parse(body) as { tags?: unknown }).tags;
  } catch {
    return deny(400, "Invalid JSON");
  }
  if (!Array.isArray(tags) || tags.length === 0 || !tags.every((t) => typeof t === "string" && ALLOWED_TAGS.has(t))) {
    return deny(400, "Unknown tag");
  }

  // expire: 0 → the next request blocks on fresh data instead of serving the stale price.
  for (const tag of tags as string[]) revalidateTag(tag, { expire: 0 });
  return Response.json({ ok: true, revalidated: tags, now: Date.now() });
}
