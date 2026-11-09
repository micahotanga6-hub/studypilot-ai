import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 font-medium">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-lg text-[#f6f1e7] font-display">S</span>
      {compact ? null : <span className="font-display text-lg tracking-tight">StudyPilot</span>}
    </Link>
  );
}
