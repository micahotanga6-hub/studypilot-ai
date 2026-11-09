"use client";

import { useState } from "react";
import { Alert, Button, Field, fieldClass } from "@/components/ui";

export function ContactForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError(null);
    setStatus(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
          company: form.get("company"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The message could not be saved.");
      setStatus(data.message || "Message saved.");
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The message could not be saved.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <Field label="Name"><input name="name" required maxLength={80} className={fieldClass} /></Field>
      <Field label="Email"><input name="email" type="email" required maxLength={160} className={fieldClass} /></Field>
      <Field label="Message"><textarea name="message" required minLength={10} maxLength={2000} rows={6} className={fieldClass} /></Field>
      {error ? <Alert>{error}</Alert> : null}
      {status ? <Alert tone="ok">{status}</Alert> : null}
      <Button type="submit" disabled={working}>{working ? "Saving…" : "Save message"}</Button>
    </form>
  );
}
