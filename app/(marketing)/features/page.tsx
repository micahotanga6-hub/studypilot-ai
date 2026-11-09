import type { Metadata } from "next";
import { FEATURES } from "@/lib/content";

export const metadata: Metadata = { title: "Features" };

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">Features</p>
      <h1 className="mt-3 font-display text-5xl">Study tools that stay with your material</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">Each tool works from a document you upload. Results are saved to your account. You can edit notes, delete a deck, and export what you want to keep.</p>
      <div className="mt-10 grid gap-4">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="rounded-3xl border border-line bg-card p-6">
            <h2 className="font-display text-2xl">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
