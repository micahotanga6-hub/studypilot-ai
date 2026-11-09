import { missingFirebaseClientEnv } from "@/lib/env-public";
import { missingServerEnv } from "@/lib/env-server";
import { getBillingProvider } from "@/lib/billing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const client = missingFirebaseClientEnv();
  const server = missingServerEnv();
  const billing = getBillingProvider();
  return Response.json({
    ok: client.length === 0 && server.length === 0,
    missingClient: client,
    missingServer: server,
    billing: {
      configured: billing.isConfigured(),
      provider: billing.id,
      message: billing.statusMessage(),
    },
  });
}
