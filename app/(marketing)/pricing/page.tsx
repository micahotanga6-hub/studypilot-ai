import type { Metadata } from "next";
import { PricingGrid } from "@/components/marketing/pricing-grid";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">Pricing</p>
      <h1 className="mt-3 font-display text-5xl">Free, Student, and Pro</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">Free is $0. Student is $4.99 a month and is the recommended plan. Pro is $8.99 a month. Limits are checked on the server. Checkout is not available yet, and card details are never stored by this app.</p>
      <div className="mt-8"><PricingGrid /></div>
      <p className="mt-6 max-w-3xl text-sm leading-6 text-muted">File uploads are capped at 4 MB so they fit a normal Vercel request. Pro studies a longer excerpt of the extracted text. A payment provider that can serve a Uganda-registered business and international students can be plugged in later without rewriting the study tools.</p>
    </div>
  );
}
