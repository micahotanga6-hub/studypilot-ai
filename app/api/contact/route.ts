import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminApp, adminDb } from "@/lib/firebase/admin";
import { ApiError, json, jsonError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(160),
  message: z.string().trim().min(10, "Write a message of at least a few words.").max(2000),
  company: z.string().max(200).optional(),
});

const hits = new Map<string, number[]>();

function allowed(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= 5) return false;
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    if (body.company) return json({ ok: true });
    const ip = (request.headers.get("x-forwarded-for") || "local").split(",")[0]?.trim() || "local";
    if (!allowed(ip)) throw new ApiError(429, "Too many messages from this network. Try again later.");
    if (!getAdminApp()) {
      throw new ApiError(503, "Messages cannot be saved yet because Firebase Admin is not configured.");
    }
    await adminDb().collection(COLLECTIONS.contact).add({
      name: body.name,
      email: body.email,
      message: body.message,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });
    return json({
      ok: true,
      message: "Your message is saved in Firebase. Email delivery is not connected, so read it in the contactMessages collection.",
    });
  } catch (error) {
    return jsonError(error);
  }
}
