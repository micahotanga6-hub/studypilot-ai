import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { contactEmail } from "@/lib/env-public";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const email = contactEmail();
  return (
    <div className="mx-auto max-w-xl px-5 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">Contact</p>
      <h1 className="mt-3 font-display text-5xl">Write to the founder</h1>
      <p className="mt-4 text-sm leading-7 text-muted">
        {email ? <>Email {email} directly, or use the form. </> : "Set NEXT_PUBLIC_CONTACT_EMAIL to show a public address. "}
        The form saves the message in your Firebase project under contactMessages. It does not send an email, because no email provider is connected.
      </p>
      <ContactForm />
    </div>
  );
}
