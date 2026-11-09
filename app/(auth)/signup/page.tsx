"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, sendEmailVerification, signInWithPopup, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { SetupNotice } from "@/components/setup-notice";
import { Alert, Button, Field, fieldClass } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyAuthError } from "@/lib/errors";

async function markAge(uid: string, name: string) {
  const store = getClientDb();
  if (!store) return;
  await setDoc(doc(store, COLLECTIONS.profiles, uid), {
    displayName: name,
    school: "",
    ageConfirmed: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export default function SignupPage() {
  const router = useRouter();
  const { configured } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [age, setAge] = useState(false);

  if (!configured) return <SetupNotice title="Sign up is waiting on Firebase" />;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const auth = getClientAuth();
    if (!auth) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (!age) {
      setError("Confirm that you are 13 or older.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(credential.user, { displayName: name });
      await markAge(credential.user.uid, name);
      await sendEmailVerification(credential.user);
      router.push("/app");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setWorking(false);
    }
  }

  async function google() {
    if (!age) {
      setError("Confirm that you are 13 or older before using Google.");
      return;
    }
    const auth = getClientAuth();
    if (!auth) return;
    setWorking(true);
    setError(null);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      await markAge(credential.user.uid, credential.user.displayName || "");
      router.push("/app");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-4xl">Create your account</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Email and password, or Google. You will need to verify an email password account before generating study sets.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Name"><input name="name" required maxLength={80} autoComplete="name" className={fieldClass} /></Field>
        <Field label="Email"><input name="email" type="email" required autoComplete="email" className={fieldClass} /></Field>
        <Field label="Password" hint="At least 8 characters."><input name="password" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} /></Field>
        <Field label="Confirm password"><input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} /></Field>
        <label className="flex items-start gap-2 text-sm leading-6">
          <input type="checkbox" className="mt-1" checked={age} onChange={(event) => setAge(event.target.checked)} required />
          <span>I am 13 or older.</span>
        </label>
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" className="w-full" disabled={working}>{working ? "Creating account…" : "Create account"}</Button>
        <Button type="button" variant="secondary" className="w-full" disabled={working} onClick={google}>
          Continue with Google
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">Already have an account? <Link href="/login" className="underline">Log in</Link></p>
    </>
  );
}
