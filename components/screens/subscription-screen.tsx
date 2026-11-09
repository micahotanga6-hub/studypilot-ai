"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, PageHeader } from "@/components/ui";
import { UsageMeters } from "@/components/usage-meters";
import { useAccount } from "@/components/use-account";
import { listOwned } from "@/lib/client-data";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyFirebaseError } from "@/lib/errors";
import { PLAN_LIST } from "@/lib/plans";
import type { PaymentRecord } from "@/lib/types";

interface BillingStatus {
  configured: boolean;
  provider: string;
  message: string;
}

export function SubscriptionScreen() {
  const { user, plan, limits, usage, accountError } = useAccount();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/status").then((response) => response.json()).then(setBilling).catch(() => undefined);
    if (!user) return;
    listOwned<PaymentRecord>(COLLECTIONS.payments, user.uid).then(setPayments).catch((err) => setError(friendlyFirebaseError(err)));
  }, [user]);

  async function checkout(nextPlan: "student" | "pro") {
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: nextPlan, returnUrl: window.location.href }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout is not available.");
      if (typeof data.url === "string") window.location.assign(data.url);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Checkout is not available.");
    }
  }

  return (
    <>
      <PageHeader title="Subscription" lede={`Your account is on ${limits.label}. Paid features stay off until a payment is verified.`} />
      {accountError ? <div className="mb-4"><Alert>{accountError}</Alert></div> : null}
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      {notice ? <div className="mb-4"><Alert tone="info">{notice}</Alert></div> : null}
      <Card>
        <h2 className="font-display text-2xl">Usage this month</h2>
        <div className="mt-4"><UsageMeters usage={usage} limits={limits} /></div>
      </Card>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {PLAN_LIST.map((item) => (
          <Card key={item.id} className={item.id === plan ? "border-pine" : ""}>
            <h3 className="font-display text-2xl">{item.label}</h3>
            <p className="mt-2 font-display text-3xl">{item.price}<span className="text-sm text-muted">/month</span></p>
            <p className="mt-2 text-sm leading-6 text-muted">{item.blurb}</p>
            {item.id === "free" || item.id === plan ? (
              <p className="mt-4 text-sm">{item.id === plan ? "Current plan" : "Included"}</p>
            ) : (
              <Button className="mt-4" disabled={!billing?.configured} onClick={() => checkout(item.id as "student" | "pro")}>
                {billing?.configured ? `Continue to ${item.label}` : "Coming soon"}
              </Button>
            )}
          </Card>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">{billing?.message || "Checking whether a billing provider is configured."} Changing or cancelling a paid plan will be available after a provider is connected. This app does not store card numbers.</p>
      <Card className="mt-6">
        <h2 className="font-display text-2xl">Billing history</h2>
        {payments.length === 0 ? <p className="mt-3 text-sm text-muted">No payments yet.</p> : (
          <ul className="mt-3 space-y-2 text-sm">
            {payments.map((payment) => <li key={payment.id}>{payment.provider} · {(payment.amountCents / 100).toFixed(2)} {payment.currency} · {payment.status}</li>)}
          </ul>
        )}
      </Card>
    </>
  );
}
