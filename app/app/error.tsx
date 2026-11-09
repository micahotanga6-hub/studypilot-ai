"use client";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl">This page hit an error</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{error.message || "Something went wrong."}</p>
      <button type="button" className="mt-4 rounded-full bg-pine px-4 py-2.5 text-sm font-medium text-white" onClick={reset}>Try again</button>
    </div>
  );
}
