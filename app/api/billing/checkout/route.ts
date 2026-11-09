import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { getBillingProvider } from "@/lib/billing";
import { json, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  plan: z.enum(["student", "pro"]),
  returnUrl: z.string().url().max(300),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = bodySchema.parse(await request.json());
    const billing = getBillingProvider();
    if (!billing.isConfigured()) {
      return json({ error: billing.statusMessage(), code: "BILLING", comingSoon: true }, 501);
    }
    const session = await billing.createCheckoutSession({
      uid: user.uid,
      email: user.email,
      plan: body.plan,
      returnUrl: body.returnUrl,
    });
    return json(session);
  } catch (error) {
    return jsonError(error);
  }
}
