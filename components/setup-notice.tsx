import { missingFirebaseClientEnv } from "@/lib/env-public";

export function SetupNotice({ title = "StudyPilot needs its Firebase keys" }: { title?: string }) {
  const missing = missingFirebaseClientEnv();
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-line bg-card p-6 shadow-[0_16px_40px_rgba(26,35,50,0.04)]">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">Setup</p>
      <h1 className="mt-2 font-display text-3xl">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        The app is running, but Firebase is not configured, so sign-in cannot start. Add the missing values to <code>.env.local</code> for local work, or to the Vercel project, then redeploy. Nothing here is stored until that is done.
      </p>
      {missing.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm">
          {missing.map((key) => (
            <li key={key} className="rounded-xl bg-paper px-3 py-2 font-mono text-xs">{key}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4 text-sm leading-6 text-muted">The README in this project lists each step: create the Firebase project, copy the web app config, add the Admin service account, and add the Grok API key.</p>
    </div>
  );
}
