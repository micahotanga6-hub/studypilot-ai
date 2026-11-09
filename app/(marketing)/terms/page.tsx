import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="rounded-2xl border border-gold/40 bg-[#f8f1e4] px-4 py-3 text-sm">Draft for the founder to review with a lawyer before a public launch. This is not a finished terms of service.</p>
      <h1 className="mt-6 font-display text-5xl">Terms</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted">
        <p>StudyPilot AI provides study tools that work from material you supply. You need the right to upload that material. Do not upload content you are not allowed to use.</p>
        <p>Generated notes, cards, and quizzes can be wrong or incomplete. They are study aids, not a substitute for the source, a teacher, or an official syllabus. Practice questions are not official, past, or leaked exam papers.</p>
        <p>The free plan has monthly limits. Student and Pro features are described on the pricing page. They are not turned on by a button in the app. A paid plan changes only after a verified payment, once a billing provider is connected. This version does not take payment.</p>
        <p>You are responsible for keeping your password private. You can reset it by email and you can delete the account.</p>
        <p>The service may change while it is in early development. The founder can suspend access that abuses the AI limits or breaks the law.</p>
      </div>
    </div>
  );
}
