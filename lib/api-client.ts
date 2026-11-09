import { getClientAuth } from "@/lib/firebase/client";

export async function authFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const user = getClientAuth()?.currentUser;
  if (!user) throw new Error("Sign in required.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${user.getIdToken ? await user.getIdToken() : ""}`);
  const response = await fetch(url, { ...init, headers });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(data.error || "The request failed.");
  return data as T;
}
