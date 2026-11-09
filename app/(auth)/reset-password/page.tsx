"use client";

import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { SetupNotice } from "@/components/setup-notice";
import { Alert, Button, Field, fieldClass } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { getClientAuth } from "@/lib/firebase/client";
import { friendlyAuthError } from "@/lib/errors";

export default function ResetPage() {
  const { configured } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [working, setWorking] = useState(false);

  if (!configured) return <SetupNotice title="Password reset is waiting on Firebase" />;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const auth = getClientAuth();
    if (!auth) return;
    setWorking(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, String(new FormData(event.currentTarget).get("email") || ""));
      setDone(true);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-4xl">Reset your password</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Firebase sends the reset link. If there is no account for that email, you may still see the same confirmation.</p>
      {done ? <div className="mt-6"><Alert tone="ok">If an account exists for that email, a reset message is on its way.</Alert></div> : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email"><input name="email" type="email" required autoComplete="email" className={fieldClass} /></Field>
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" disabled={working}>{working ? "Sending…" : "Send reset email"}</Button>
        </form>
      )}
      <p className="mt-4 text-sm"><Link href="/login" className="underline">Back to log in</Link></p>
    </>
  );
}
