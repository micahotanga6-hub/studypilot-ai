"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { SetupNotice } from "@/components/setup-notice";
import { Alert, Button, Field, fieldClass } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { getClientAuth } from "@/lib/firebase/client";
import { friendlyAuthError } from "@/lib/errors";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/app") || value.startsWith("//")) return "/app";
  return value;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { configured, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const next = safeNext(params.get("next"));

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  if (!configured) return <SetupNotice title="Log in is waiting on Firebase" />;
  if (user) return <p className="text-sm text-muted">Opening your workspace…</p>;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const auth = getClientAuth();
    if (!auth) return;
    const form = new FormData(event.currentTarget);
    setWorking(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, String(form.get("email") || ""), String(form.get("password") || ""));
      router.push(next);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setWorking(false);
    }
  }

  async function google() {
    const auth = getClientAuth();
    if (!auth) return;
    setWorking(true);
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push(next);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-4xl">Log in</h1>
      <p className="mt-2 text-sm text-muted">Use the email and password for your StudyPilot account, or Google.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Email"><input name="email" type="email" required autoComplete="email" className={fieldClass} /></Field>
        <Field label="Password"><input name="password" type="password" required minLength={8} autoComplete="current-password" className={fieldClass} /></Field>
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" className="w-full" disabled={working}>{working ? "Signing in…" : "Log in"}</Button>
      </form>
      <Button type="button" variant="secondary" className="mt-3 w-full" disabled={working} onClick={google}>Continue with Google</Button>
      <p className="mt-4 text-sm text-muted"><Link href="/reset-password" className="underline">Forgot your password?</Link></p>
      <p className="mt-2 text-sm text-muted">New here? <Link href="/signup" className="underline">Create an account</Link></p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
