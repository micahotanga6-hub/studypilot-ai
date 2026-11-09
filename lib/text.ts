export const STORED_TEXT_CAP = 500_000;

export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenScore(left: string, right: string): number {
  const a = normalizeAnswer(left).split(" ").filter((word) => word.length > 2);
  const b = new Set(normalizeAnswer(right).split(" ").filter((word) => word.length > 2));
  if (a.length === 0 || b.size === 0) return 0;
  const hits = a.filter((word) => b.has(word)).length;
  return hits / Math.max(a.length, b.size);
}

export function answersMatch(given: string, expected: string, acceptable: string[] = []): boolean {
  const guess = normalizeAnswer(given);
  if (!guess) return false;
  return [expected, ...acceptable].some((candidate) => {
    const target = normalizeAnswer(candidate);
    if (!target) return false;
    if (guess === target) return true;
    if (target.length >= 12 && (guess.includes(target) || target.includes(guess))) return true;
    return tokenScore(guess, target) >= 0.72;
  });
}

export function selectSource(text: string, maxChars: number): {
  excerpt: string;
  used: number;
  total: number;
  truncated: boolean;
} {
  const clean = text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  if (clean.length <= maxChars) {
    return { excerpt: clean, used: clean.length, total: clean.length, truncated: false };
  }
  const slice = clean.slice(0, maxChars);
  const cut = slice.lastIndexOf("\n");
  const excerpt = (cut > maxChars * 0.7 ? slice.slice(0, cut) : slice).trim();
  return { excerpt, used: excerpt.length, total: clean.length, truncated: true };
}

export function capStoredText(text: string): { text: string; extractedCharCount: number; textTruncated: boolean } {
  const clean = text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  if (clean.length <= STORED_TEXT_CAP) {
    return { text: clean, extractedCharCount: clean.length, textTruncated: false };
  }
  return {
    text: clean.slice(0, STORED_TEXT_CAP),
    extractedCharCount: clean.length,
    textTruncated: true,
  };
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return slug || "study-notes";
}

export function markdownToText(markdown: string): string {
  return markdown
    .replace(/^>\s?/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function safeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() || "upload";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "upload";
}

export function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function studyStreak(timestamps: number[], now = Date.now()): number {
  const days = [...new Set(timestamps.map(utcDay))].sort().reverse();
  if (days.length === 0) return 0;
  const today = utcDay(now);
  const yesterday = utcDay(now - 86_400_000);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let count = 1;
  for (let index = 1; index < days.length; index += 1) {
    const previous = Date.parse(`${days[index - 1]}T00:00:00Z`);
    const current = Date.parse(`${days[index]}T00:00:00Z`);
    if (previous - current === 86_400_000) count += 1;
    else break;
  }
  return count;
}

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}
