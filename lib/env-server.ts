import "server-only";

export function missingServerEnv(): string[] {
  const missing: string[] = [];
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      const parsed = JSON.parse(json) as { project_id?: string; client_email?: string; private_key?: string };
      if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
        missing.push("FIREBASE_SERVICE_ACCOUNT_JSON (needs project_id, client_email, and private_key)");
      }
    } catch {
      missing.push("FIREBASE_SERVICE_ACCOUNT_JSON (the value is not valid JSON)");
    }
  } else {
    for (const key of ["FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY"]) {
      if (!process.env[key]?.trim()) missing.push(key);
    }
  }
  if (!process.env.XAI_API_KEY?.trim()) missing.push("XAI_API_KEY");
  return missing;
}

export function isGrokConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY?.trim());
}
