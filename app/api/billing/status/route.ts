import { getBillingProvider } from "@/lib/billing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const billing = getBillingProvider();
  return Response.json({
    configured: billing.isConfigured(),
    provider: billing.id,
    message: billing.statusMessage(),
  });
}
