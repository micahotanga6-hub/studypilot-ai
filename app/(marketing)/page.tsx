import Link from "next/link";
import { FAQS, FEATURES, TAGLINE } from "@/lib/content";
import { PricingGrid } from "@/components/marketing/pricing-grid";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">For students</p>
          <h1 className="mt-4 max-w-xl font-display text-5xl leading-[1.05] sm:text-6xl">{TAGLINE}</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted">
            Upload a chapter, a set of notes, or text you paste in. StudyPilot turns that material into notes, flashcards, and practice quizzes you can save, edit, and review.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-full bg-pine px-5 py-3 text-sm font-medium text-white hover:bg-pine-dark">Create a free account</Link>
            <Link href="/pricing" className="rounded-full border border-line bg-card px-5 py-3 text-sm font-medium hover:border-ink">See pricing</Link>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted">The free plan includes 3 uploads and 3 quizzes a month. Student is $4.99 and Pro is $8.99. Checkout is not open yet, so paid plans cannot be purchased in this version.</p>
        </div>
        <div className="rounded-[2rem] border border-line bg-card p-4 shadow-[0_24px_60px_rgba(26,35,50,0.06)]">
          <p className="px-2 text-xs uppercase tracking-[0.14em] text-gold">Example layout, not your notes</p>
          <div className="mt-3 rounded-3xl bg-[#f7f3eb] p-4">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>AI Summaries</span>
              <span>Simple explanation</span>
            </div>
            <h2 className="mt-3 font-display text-2xl">Photosynthesis</h2>
            <p className="mt-2 text-sm leading-6 text-muted">A preview of how a saved note sits in the workspace after you upload a real document.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {["What is the chloroplast?", "Where do light reactions happen?", "What does the Calvin cycle make?"].map((card) => (
                <div key={card} className="rounded-2xl border border-line bg-card px-3 py-4 text-sm">{card}</div>
              ))}
            </div>
            <p className="mt-4 text-sm">Practice score from a finished quiz would appear here. This box is only a picture of the layout.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <h2 className="font-display text-3xl">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["1. Add your material", "Upload a PDF, DOCX, or TXT file, or paste the text. StudyPilot extracts the words and tells you if a file cannot be read."],
            ["2. Generate a study set", "Choose notes, flashcards, or a quiz. The result is checked for shape before it is saved."],
            ["3. Review and keep it", "Edit notes, flip cards, mark what you have learned, and see explanations for quiz answers you missed."],
          ].map(([title, body]) => (
            <li key={title} className="rounded-3xl border border-line bg-card p-5">
              <h3 className="font-display text-2xl">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl">What you can do</h2>
          <Link href="/features" className="text-sm text-pine">All features</Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {FEATURES.slice(0, 3).map((feature) => (
            <article key={feature.title} className="rounded-3xl border border-line bg-card p-5">
              <h3 className="font-display text-2xl">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-5">
        <h2 className="font-display text-3xl">Pricing</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Monthly prices in US dollars. Paid checkout is not connected, so every new account stays on Free until a verified payment exists.</p>
        <div className="mt-6"><PricingGrid /></div>
      </section>

      <section className="mx-auto mt-16 max-w-3xl px-5">
        <h2 className="font-display text-3xl">Questions</h2>
        <div className="mt-4 divide-y divide-line rounded-3xl border border-line bg-card px-5">
          {FAQS.slice(0, 4).map((item) => (
            <details key={item.question} className="py-4">
              <summary className="cursor-pointer font-medium">{item.question}</summary>
              <p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
        <Link href="/faq" className="mt-4 inline-block text-sm text-pine">Read the full FAQ</Link>
      </section>
    </>
  );
}
