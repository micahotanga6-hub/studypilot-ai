export const FIREBASE_CLIENT_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

export function missingFirebaseClientEnv(): string[] {
  return FIREBASE_CLIENT_KEYS.filter((key) => !process.env[key]?.trim());
}

export function isFirebaseClientConfigured(): boolean {
  return missingFirebaseClientEnv().length === 0;
}

export function contactEmail(): string {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";
}
