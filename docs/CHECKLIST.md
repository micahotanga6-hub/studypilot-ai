# StudyPilot AI — development checklist

Status for this MVP. "Tested" means checked in this workspace. Live Firebase and Grok calls need the founder's keys, so those flows are implemented and covered by the production build, not by a live account here.

## Completed

- Next.js App Router, TypeScript, Tailwind, production build.
- Marketing pages: home, features, pricing, about, contact, FAQ, privacy, terms.
- Tagline, plan prices (Free $0, Student $4.99, Pro $8.99), no fake testimonials or user counts.
- Email/password and Google auth screens, password reset, email verification gate, protected `/app` routes.
- Age confirmation (13+).
- Dashboard sidebar: Dashboard, My Documents, AI Summaries, Flashcards, Quizzes, Study Planner, AI Tutor, Progress, Subscription, Settings.
- Upload PDF, DOCX, TXT, and pasted text. Server-side extraction. Clear failure when a file has no text.
- Notes styles from the spec. Save, view, edit, delete, export Markdown/text, print.
- Flashcards: generate, flip, shuffle, difficulty, learned, due-again delay, saved decks.
- Quizzes: multiple choice, true/false, short answer, mixed, count, difficulty. Server-side marking, score, explanations, saved attempts. Exam-style is Pro-only.
- Free-plan limits enforced on the server, with a refund of the monthly count if generation fails.
- Billing interface with checkout and webhook routes. Upgrade buttons stay "Coming soon" until a provider is actually configured.
- Manual study planner. AI planner and AI tutor implemented and locked to Student/Pro.
- Progress from real documents, cards, attempts, and sessions.
- Account deletion.
- Firestore rules, Storage rules, indexes, `.env.example`, README.

## Incomplete

- Real card checkout. Provider is not chosen. No webhook can mark a payment as paid yet.
- Admin dashboard (users, revenue, error log).
- Advanced analytics beyond the counts on Progress.
- Group study and a native mobile app.
- Email delivery for the contact form.
- OCR for scanned PDFs and photos.
- Spaced repetition beyond easy / medium / difficult delays.

## Tested here

- `npm run build` and `npm run lint` complete.
- Marketing pages, mobile navigation, the unconfigured login state, and the contact form were exercised in a browser.
- PDF and DOCX text extraction was checked on sample files.
- Text helpers for answer matching, excerpts, and streaks.
- Missing environment variables do not crash the build.

## Not tested here

- A real Firebase sign-up, Google popup, or password email.
- A real PDF/DOCX upload against the founder's bucket.
- A live Grok response.
- Deployed Firestore rules against a live project. Deploy them with the README steps before judging security in production.
