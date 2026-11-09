import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary: "bg-pine text-white hover:bg-pine-dark",
  secondary: "border border-line bg-card text-ink hover:border-ink",
  ghost: "text-ink hover:bg-paper-deep",
  danger: "bg-danger text-white hover:opacity-90",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export const fieldClass =
  "w-full rounded-2xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-pine focus:ring-2 focus:ring-pine/20";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}

export function Alert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" | "ok" }) {
  const toneClass =
    tone === "ok" ? "border-pine/30 bg-pine/10" : tone === "info" ? "border-gold/40 bg-[#f8f1e4]" : "border-danger/30 bg-[#fbeeee] text-danger";
  return <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClass}`}>{children}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line bg-card p-5 shadow-[0_16px_40px_rgba(26,35,50,0.04)] ${className}`}>{children}</section>;
}

export function PageHeader({ title, lede, action }: { title: string; lede?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        {lede ? <p className="mt-2 text-sm leading-6 text-muted">{lede}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <h2 className="font-display text-xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </Card>
  );
}
