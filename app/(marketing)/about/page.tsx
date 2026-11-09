import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">About</p>
      <h1 className="mt-3 font-display text-5xl">A study workspace for the notes you already have</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted">
        <p>StudyPilot AI is being built by its founder, Otanga, in Uganda, for students anywhere. The idea is simple: a chapter or a set of class notes should be enough to produce a summary, a deck of cards, and a practice quiz.</p>
        <p>The product is freemium. The free plan is usable on its own. Student and Pro raise the limits and open the tutor, AI planner, and exam-style practice. Those paid features stay locked until a real payment is verified. Payments are not connected in this version.</p>
        <p>Your files and generated study sets are stored in Firebase under your account. The text used for a generation is sent to the Grok API from the server. The API key never goes to the browser.</p>
      </div>
    </div>
  );
}
