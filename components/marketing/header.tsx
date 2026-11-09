"use client";

import Link from "next/link";
import { useState } from "react";
import { Brand } from "@/components/brand";

const links = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line/80 bg-[#f3eee4]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Brand />
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">{link.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm hover:bg-paper-deep">Log in</Link>
          <Link href="/signup" className="rounded-full bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-pine-dark">Get started</Link>
        </div>
        <button
          type="button"
          className="rounded-full border border-line px-3 py-2 text-sm md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <div id="mobile-nav" className="border-t border-line px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
            <Link href="/signup" onClick={() => setOpen(false)} className="font-medium text-pine">Get started</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
