import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="rounded-2xl border border-gold/40 bg-[#f8f1e4] px-4 py-3 text-sm">Draft for the founder to review with a lawyer before a public launch. This is not a finished privacy policy.</p>
      <h1 className="mt-6 font-display text-5xl">Privacy</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted">
        <p>StudyPilot stores the account email, display name, an optional school name, and a confirmation that the person is 13 or older. It does not ask for a date of birth or a card number.</p>
        <p>Documents, notes, flashcards, quizzes, quiz attempts, planner tasks, tutor messages, and monthly usage counts are stored in Firebase under that account. Security rules are written so one student cannot read another student’s data. Original uploads can also be stored in Firebase Storage.</p>
        <p>When you generate notes, cards, a quiz, a tutor reply, or an AI plan, the relevant text is sent from the server to the Grok API (xAI). The API key stays on the server.</p>
        <p>You can delete a document, which also deletes the notes, decks, and quizzes made from it. You can delete the whole account from Settings. That removes the Firebase Authentication user, the stored study data, and uploaded files.</p>
        <p>Contact form messages are saved in Firestore so the project owner can read them. They are not emailed automatically.</p>
        <p>The service is not directed at children under 13. People under 13 should not create an account.</p>
      </div>
    </div>
  );
}
