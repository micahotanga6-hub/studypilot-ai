"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail, signOut, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Alert, Button, Card, Field, PageHeader, fieldClass } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { authFetch } from "@/lib/api-client";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyAuthError, friendlyFirebaseError } from "@/lib/errors";

export function SettingsScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.displayName || "");
  const [school, setSchool] = useState(profile?.school || "");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    const store = getClientDb();
    if (!store) return;
    setWorking(true);
    setError(null);
    try {
      await setDoc(doc(store, COLLECTIONS.profiles, user.uid), {
        displayName: name.trim(),
        school: school.trim(),
        ageConfirmed: profile?.ageConfirmed === true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await updateProfile(user, { displayName: name.trim() });
      await setDoc(doc(store, COLLECTIONS.users, user.uid), { displayName: name.trim() }, { merge: true });
      await refreshProfile();
      setMessage("Profile saved.");
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setWorking(false);
    }
  }

  async function resetPassword() {
    const auth = getClientAuth();
    if (!auth || !user?.email) return;
    setError(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage("Password reset email sent.");
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  }

  async function logout() {
    const auth = getClientAuth();
    if (!auth) return;
    await signOut(auth);
    router.push("/");
  }

  async function deleteAccount() {
    if (confirm !== "DELETE") return setError("Type DELETE in the box to confirm.");
    setWorking(true);
    setError(null);
    try {
      await authFetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: "DELETE" }) });
      const auth = getClientAuth();
      if (auth) await signOut(auth).catch(() => undefined);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The account could not be deleted.");
      setWorking(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" lede="Your profile stores a name, an optional school, and the age confirmation. The email comes from Firebase Authentication." />
      {message ? <div className="mb-4"><Alert tone="ok">{message}</Alert></div> : null}
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      <Card>
        <form onSubmit={save} className="space-y-4">
          <Field label="Name"><input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className={fieldClass} /></Field>
          <Field label="School" hint="Optional."><input value={school} onChange={(event) => setSchool(event.target.value)} maxLength={120} className={fieldClass} /></Field>
          <Field label="Email"><input value={user?.email || ""} disabled className={fieldClass} /></Field>
          <Button type="submit" disabled={working}>Save profile</Button>
        </form>
      </Card>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={resetPassword}>Send password reset email</Button>
        <Button variant="ghost" onClick={logout}>Log out</Button>
      </div>
      <Card className="mt-6">
        <h2 className="font-display text-2xl">Delete account</h2>
        <p className="mt-2 text-sm leading-6 text-muted">This deletes the login, documents, notes, cards, quizzes, plans, tutor messages, and uploaded files. It cannot be undone from the app.</p>
        <input value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Type DELETE" className={`${fieldClass} mt-4 max-w-xs`} />
        <div className="mt-3"><Button variant="danger" disabled={working} onClick={deleteAccount}>Delete my account</Button></div>
      </Card>
    </>
  );
}
