import { getBillingProvider } from "@/lib/billing";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const billing = getBillingProvider();
    const result = await billing.handleWebhook(request);
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
