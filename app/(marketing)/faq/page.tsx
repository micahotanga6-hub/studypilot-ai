import type { Metadata } from "next";
import { FAQS } from "@/lib/content";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">FAQ</p>
      <h1 className="mt-3 font-display text-5xl">Questions, answered plainly</h1>
      <div className="mt-8 divide-y divide-line rounded-3xl border border-line bg-card px-5">
        {FAQS.map((item) => (
          <details key={item.question} className="py-4" open>
            <summary className="cursor-pointer font-medium">{item.question}</summary>
            <p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
