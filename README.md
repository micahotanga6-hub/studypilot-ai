# StudyPilot AI

StudyPilot turns a student's own notes into summaries, flashcards, and practice quizzes.

Tagline: **Study smarter. Understand more. Achieve your goals.**

This repository is the app. It runs on Next.js and is ready to import into Vercel. Firebase holds accounts and saved study data. The Grok API (from xAI) writes the notes, cards, quizzes, tutor replies, and AI timetables. The API key stays on the server.

You do not need to change any code to publish it. You do need a Firebase project, a Grok API key, and the environment variables below.

## What you need before you start

- A computer with Node.js 20 or newer, if you want to run the app on your own machine. Vercel does not need this.
- A Google account for Firebase.
- An xAI account for the Grok API key: [https://console.x.ai](https://console.x.ai)
- A Vercel account connected to the Git host where this repo lives.

## 1. Create the Firebase project

1. Open [https://console.firebase.google.com](https://console.firebase.google.com) and create a project. You can turn Google Analytics off.
2. In the left menu, open **Build → Authentication → Get started**.
3. Enable **Email/Password**.
4. Enable **Google**.
5. Open **Authentication → Settings → Authorized domains**.
   - `localhost` is already there for local testing.
   - After Vercel gives you a site address, add that domain too (for example `your-app.vercel.app`). Google sign-in fails until the domain is listed.
6. Open **Build → Firestore Database → Create database**. Choose production mode. Pick a region close to your students.
7. Open **Build → Storage → Get started**. Use the default rules for now. You will replace them in step 5 with the rules from this repo. Storage is what keeps the original PDF or DOCX. Pasted text still works if Storage is not ready.
8. Open the gear icon → **Project settings**.
9. Under **Your apps**, add a **Web** app. You can skip Firebase Hosting. Copy the config values. They look like this:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`
10. Still in Project settings, open **Service accounts → Generate new private key**. This downloads a JSON file. Keep it private. From that file:
    - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
    - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
    - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

The private key has several lines. On Vercel, paste it as one line and keep the `\n` characters where the line breaks were. Do not wrap it in extra quotes unless the dashboard adds them itself.

You can instead paste the entire JSON file as one line into `FIREBASE_SERVICE_ACCOUNT_JSON` and leave the three `FIREBASE_ADMIN_*` fields empty.

## 2. Get the Grok API key

1. Open [https://console.x.ai](https://console.x.ai) and create an API key.
2. Put it in `XAI_API_KEY`.
3. Leave `XAI_MODEL` as `grok-4.7`, or change it to another model your account is allowed to call. If a generation says the model was not accepted, this is the value to change.

The browser never sees this key. Only the server routes call xAI.

## 3. Add the environment variables

Every name is listed, with comments, in [`.env.example`](.env.example).

**On your computer**

```bash
cp .env.example .env.local
```

Fill in `.env.local`. Do not commit that file.

Then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**On Vercel**

1. Import this repository. Vercel detects Next.js. You do not need a custom build command or a `vercel.json`.
2. Before the first deploy, open **Settings → Environment Variables** and add every value from `.env.example` that you filled in.
3. Deploy.

`NEXT_PUBLIC_` values are copied into the browser bundle when Vercel builds. If you add or change one later, redeploy. Server values such as `XAI_API_KEY` and the Firebase private key are read when a request runs, but a redeploy is still the safe habit.

If a value is missing, the app stays up. Pages that need Firebase show a setup message that names the missing variables. AI buttons return a clear error instead of crashing.

## 4. Deploy the security rules

The rules make sure a signed-in student can read and edit only their own study data. The Admin service account bypasses these rules, which is how the server saves generations and enforces plan limits.

From the project folder, after `.env.local` exists is fine — this command uses your Firebase login, not the env file:

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

Choose the Firebase project when `use --add` asks. That creates `.firebaserc` on your machine. You do not need to commit it.

Indexes can take a few minutes to show as **Enabled** in Firestore → Indexes. Until then, a list in the app may say Firestore is still preparing that list. Wait and reload.

## 5. Publish on Vercel

1. Push this repository to GitHub (or the Git host Vercel uses).
2. In Vercel, choose **Add New → Project** and import the repo.
3. Confirm the environment variables from step 3 are set for Production.
4. Click **Deploy**.
5. Copy the site address and add it under Firebase **Authentication → Settings → Authorized domains**.
6. Open the site, create an account, and click the verification email before generating anything.

Email/password accounts must verify their email. Google accounts are already verified.

## How to try the app

1. Create an account and confirm you are 13 or older.
2. Open the verification email, then choose **I have verified** in the app.
3. Go to **My Documents** and upload a text-based PDF, a DOCX, a TXT file, or paste a paragraph.
4. Open the document and make notes, flashcards, or a quiz.
5. Open the note to edit it, export Markdown or plain text, or print it.
6. Open a deck, flip a card, shuffle, and mark difficulty or learned.
7. Take a quiz and submit it. The score and the explanations for missed questions are saved.

A scanned PDF or a photo of a page has no text to read. The app says so. It does not invent notes from an empty file.

## Plans and payments

| Plan | Price | What it includes |
| --- | --- | --- |
| Free | $0 | 3 uploads, 5 basic notes, 2 decks (up to 10 cards), 3 quizzes (up to 8 questions) each month. Manual planner. |
| Student | $4.99 / month | 30 uploads, fuller note styles, more cards and quizzes, the AI tutor, and AI study plans. Recommended. |
| Pro | $8.99 / month | Higher limits, hard exam-style practice, and longer explanations. |

Checkout is **not connected**. Upgrade buttons say **Coming soon** and do not pretend a payment went through. Card numbers are never stored.

Limits are checked on the server. A student cannot raise their own plan from the browser.

Paid features (detailed note styles, the tutor, AI timetables, hard quizzes, exam-style practice) stay locked on Free.

### For you, the project owner, before a payment provider exists

Customers cannot switch plans inside the app. If you need to test Student or Pro yourself, open Firestore, find `users/{your user id}`, and set `plan` to `student` or `pro`. Security rules stop the app from doing that. Change it back to `free` when you are done. This is an operator override, not a billing system.

When you choose a provider that can bill a Uganda-registered business and international customers, implement `BillingProvider` in `lib/billing/index.ts`. Verify the webhook signature, then call `applyVerifiedSubscription`. Do not unlock a plan from a browser request. Set `BILLING_PROVIDER` only after that code exists. Until then leave it as `none`.

## File uploads and long documents

- Free uploads can be up to 2 MB. Student and Pro can be up to 4 MB. Vercel's normal request size is about 4.5 MB, so the app stays under that on purpose.
- Very long text is stored up to 500,000 characters. Generation uses a shorter excerpt (16,000 on Free, 48,000 on Student, 80,000 on Pro). The saved note, deck, or quiz says when it did not see the rest.

## What is included

- Public pages: home, features, pricing, about, contact, FAQ, privacy, and terms. Privacy and terms are labeled as drafts.
- Email/password and Google sign-in, log out, password reset, email verification, and protected app pages.
- Dashboard with the sidebar from the product spec.
- Upload and paste, with server-side text extraction.
- Notes in the spec's styles, saved in Firestore, with edit, delete, and export.
- Flashcards with flip, shuffle, difficulty, learned state, and a simple review delay.
- Quizzes: multiple choice, true/false, short answer, and mixed. Count and difficulty. Auto-marking, score, explanations for wrong answers, saved attempts.
- Manual study planner for every account.
- AI tutor and AI study plans, built and locked to Student and Pro.
- Progress counted only from real saved activity.
- Account deletion.
- Firestore and Storage rules, and a pluggable billing interface.

## What is not included

- A working card checkout. Buttons stay on "Coming soon".
- An admin dashboard.
- Advanced analytics, group study, and a native mobile app.
- Email delivery for the contact form. Messages are saved in the `contactMessages` collection for you to read in Firebase. Set `NEXT_PUBLIC_CONTACT_EMAIL` if you want an address on the contact page.
- Reading scanned pages or images. Only selectable text is extracted.

## If something fails

- **Setup message on the login page:** a `NEXT_PUBLIC_FIREBASE_...` value is missing or the site was not redeployed after you added it.
- **"Firebase Admin is not configured":** the service account variables are missing or the private key lost its line breaks. Use `\n` inside the key.
- **"Verify your email":** open the Firebase mail, then press **I have verified**. Check spam. The sender is Firebase, not StudyPilot.
- **Google window error about the domain:** add the site under Authorized domains.
- **A list says an index is still building:** wait until Firestore shows the indexes as Enabled.
- **A PDF will not import:** it may be a scan, damaged, or password-protected. The message on screen says which case it could tell.
- **The model was not accepted:** change `XAI_MODEL` to a model your xAI account can use, then try again.
- **The model took too long:** try a shorter document or a faster model. On Vercel's free plan, a function may stop around 10 seconds. A paid Vercel plan honors the 60 second limit set on the AI routes.

## Scripts

```bash
npm run dev    # local site
npm run build  # production build
npm run start  # run the production build
npm run lint   # check the code
```

A development checklist is in [docs/CHECKLIST.md](docs/CHECKLIST.md).
