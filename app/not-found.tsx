import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-5 py-24">
      <p className="text-xs uppercase tracking-[0.16em] text-gold">404</p>
      <h1 className="mt-3 font-display text-5xl">That page is not here</h1>
      <p className="mt-4 text-sm leading-6 text-muted">The link may be old, or the page was never part of this version.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-pine px-4 py-2.5 text-sm font-medium text-white">Back home</Link>
    </main>
  );
}
