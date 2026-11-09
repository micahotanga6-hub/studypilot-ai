import Link from "next/link";
import { contactEmail } from "@/lib/env-public";

export function Footer() {
  const email = contactEmail();
  return (
    <footer className="no-print mt-20 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="font-display text-xl">StudyPilot AI</p>
          <p className="mt-2 text-sm leading-6 text-muted">Study tools for your own notes. Built to be published by its founder.</p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Product</p>
          <div className="mt-3 flex flex-col gap-2 text-muted">
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/faq">FAQ</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-medium">Company</p>
          <div className="mt-3 flex flex-col gap-2 text-muted">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            {email ? <a href={`mailto:${email}`}>{email}</a> : null}
          </div>
        </div>
        <div className="text-sm">
          <p className="font-medium">Legal</p>
          <div className="mt-3 flex flex-col gap-2 text-muted">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
      <p className="mx-auto max-w-6xl px-5 pb-8 text-xs leading-5 text-muted">Payments are not open yet. StudyPilot does not store card numbers. Privacy and terms pages are drafts for the founder to review before a public launch.</p>
    </footer>
  );
}
