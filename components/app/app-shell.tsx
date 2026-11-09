"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Brand } from "@/components/brand";
import { SetupNotice } from "@/components/setup-notice";
import { Alert, Button } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { getClientDb } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyAuthError } from "@/lib/errors";

const NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/documents", label: "My Documents" },
  { href: "/app/notes", label: "AI Summaries" },
  { href: "/app/flashcards", label: "Flashcards" },
  { href: "/app/quizzes", label: "Quizzes" },
  { href: "/app/planner", label: "Study Planner" },
  { href: "/app/tutor", label: "AI Tutor" },
  { href: "/app/progress", label: "Progress" },
  { href: "/app/subscription", label: "Subscription" },
  { href: "/app/settings", label: "Settings" },
];

function active(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, configured, user, profile, profileError, refreshProfile, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (ready && configured && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/app")}`);
    }
  }, [ready, configured, user, pathname, router]);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted">Loading your account…</div>;
  }
  if (!configured) return <main className="px-5 py-16"><SetupNotice /></main>;
  if (!user) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted">Redirecting to log in…</div>;
  }

  async function confirmAge() {
    const store = getClientDb();
    if (!store || !user) return;
    setWorking(true);
    try {
      await setDoc(doc(store, COLLECTIONS.profiles, user.uid), {
        displayName: profile?.displayName || user.displayName || "",
        school: profile?.school || "",
        ageConfirmed: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await refreshProfile();
    } catch (error) {
      setNotice(friendlyAuthError(error));
    } finally {
      setWorking(false);
    }
  }

  async function resend() {
    setWorking(true);
    setNotice(null);
    try {
      await sendEmailVerification(user!);
      setNotice("Verification email sent. Check your inbox and spam folder.");
    } catch (error) {
      setNotice(friendlyAuthError(error));
    } finally {
      setWorking(false);
    }
  }

  if (profile && !profile.ageConfirmed) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="font-display text-4xl">Confirm your age</h1>
        <p className="mt-3 text-sm leading-6 text-muted">StudyPilot is for students who are 13 or older. It is not for children. Confirm to continue.</p>
        {notice ? <div className="mt-4"><Alert>{notice}</Alert></div> : null}
        <Button className="mt-6" disabled={working} onClick={confirmAge}>I am 13 or older</Button>
      </main>
    );
  }

  const links = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={`rounded-2xl px-3 py-2 text-sm ${active(pathname, item.href) ? "bg-ink text-white" : "text-muted hover:bg-paper-deep hover:text-ink"}`}
          aria-current={active(pathname, item.href) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="no-print sticky top-0 hidden h-screen flex-col border-r border-line bg-[#f7f3eb] px-4 py-5 md:flex">
        <Brand />
        <div className="mt-8 flex-1 overflow-auto">{links}</div>
        <p className="truncate px-3 text-xs text-muted">{user.email}</p>
      </aside>
      <div>
        <div className="no-print flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
          <Brand compact />
          <button type="button" className="rounded-full border border-line px-3 py-2 text-sm" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {open ? "Close" : "Menu"}
          </button>
        </div>
        {open ? <div className="no-print border-b border-line px-4 py-4 md:hidden">{links}</div> : null}
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {profileError ? <div className="mb-4"><Alert>{profileError}</Alert></div> : null}
          {!user.emailVerified ? (
            <div className="no-print mb-4">
              <Alert tone="info">
                <p>Verify your email before generating notes, cards, or quizzes. Firebase sends the message.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" disabled={working} onClick={resend}>Resend email</Button>
                  <Button variant="ghost" disabled={working} onClick={() => refreshUser()}>I have verified</Button>
                </div>
              </Alert>
            </div>
          ) : null}
          {notice ? <div className="mb-4"><Alert tone="ok">{notice}</Alert></div> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
