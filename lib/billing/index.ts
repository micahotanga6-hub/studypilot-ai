import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { ApiError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";
import type { PlanId } from "@/lib/types";

export interface CheckoutInput {
  uid: string;
  email: string;
  plan: "student" | "pro";
  returnUrl: string;
}

export interface BillingProvider {
  id: string;
  isConfigured(): boolean;
  statusMessage(): string;
  createCheckoutSession(input: CheckoutInput): Promise<{ url: string }>;
  handleWebhook(request: Request): Promise<{ received: true }>;
}

/**
 * Call this only after a billing provider has verified the webhook signature.
 * The browser must never be able to reach this directly.
 */
export async function applyVerifiedSubscription(input: {
  uid: string;
  plan: PlanId;
  status: "active" | "cancelled" | "free";
  provider: string;
  externalId: string;
  amountCents?: number;
  currency?: string;
  periodEndMs?: number | null;
}) {
  const db = adminDb();
  await db.collection(COLLECTIONS.users).doc(input.uid).set({ plan: input.plan }, { merge: true });
  await db.collection(COLLECTIONS.subscriptions).doc(input.uid).set(
    {
      uid: input.uid,
      plan: input.plan,
      status: input.status,
      provider: input.provider,
      externalId: input.externalId,
      periodEndMs: input.periodEndMs ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  if (typeof input.amountCents === "number" && input.externalId) {
    await db.collection(COLLECTIONS.payments).doc(`${input.provider}_${input.externalId}`).set(
      {
        uid: input.uid,
        provider: input.provider,
        externalId: input.externalId,
        amountCents: input.amountCents,
        currency: input.currency || "usd",
        status: "paid",
        createdAt: FieldValue.serverTimestamp(),
        createdAtMs: Date.now(),
      },
      { merge: true },
    );
  }
}

class UnconfiguredBilling implements BillingProvider {
  readonly id = "none";
  isConfigured() {
    return false;
  }
  statusMessage() {
    return "Payments are not available yet. A billing provider has not been connected.";
  }
  async createCheckoutSession(): Promise<{ url: string }> {
    throw new ApiError(501, this.statusMessage(), "BILLING");
  }
  async handleWebhook(): Promise<{ received: true }> {
    throw new ApiError(501, "No billing provider is configured.", "BILLING");
  }
}

class UnknownBilling implements BillingProvider {
  constructor(readonly id: string) {}
  isConfigured() {
    return false;
  }
  statusMessage() {
    return `BILLING_PROVIDER is set to “${this.id}”, but that provider is not implemented. Checkout stays closed.`;
  }
  async createCheckoutSession(): Promise<{ url: string }> {
    throw new ApiError(501, this.statusMessage(), "BILLING");
  }
  async handleWebhook(): Promise<{ received: true }> {
    throw new ApiError(501, this.statusMessage(), "BILLING");
  }
}

export function getBillingProvider(): BillingProvider {
  const name = process.env.BILLING_PROVIDER?.trim() || "none";
  if (name === "none" || name === "") return new UnconfiguredBilling();
  return new UnknownBilling(name);
}
