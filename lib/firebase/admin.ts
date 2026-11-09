import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

interface ServiceAccountShape {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function normalizePrivateKey(value: string): string {
  let key = value.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

function readServiceAccount(): ServiceAccountShape | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    const parsed = JSON.parse(json) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: normalizePrivateKey(parsed.private_key),
    };
  }
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey?.trim()) return null;
  return { projectId, clientEmail, privateKey: normalizePrivateKey(privateKey) };
}

export function getAdminApp(): App | null {
  try {
    const account = readServiceAccount();
    if (!account) return null;
    const existing = getApps()[0];
    if (existing) return existing;
    const bucket = process.env.FIREBASE_STORAGE_BUCKET?.trim() || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
    return initializeApp({
      credential: cert(account),
      projectId: account.projectId,
      storageBucket: bucket,
    });
  } catch (error) {
    console.error("Firebase Admin could not start.", error instanceof Error ? error.message : error);
    return null;
  }
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  if (!app) return null;
  return getAuth(app);
}

export function adminDb(): Firestore {
  const app = getAdminApp();
  if (!app) {
    throw new Error("Firebase Admin is not configured.");
  }
  return getFirestore(app);
}

export function adminBucket() {
  const app = getAdminApp();
  const name = process.env.FIREBASE_STORAGE_BUCKET?.trim() || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  if (!app || !name) return null;
  return getStorage(app).bucket(name);
}
