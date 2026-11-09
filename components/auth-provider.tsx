"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";
import { isFirebaseClientConfigured } from "@/lib/env-public";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyFirebaseError } from "@/lib/errors";
import type { ProfileRecord } from "@/lib/types";

interface AuthState {
  ready: boolean;
  configured: boolean;
  user: User | null;
  profile: ProfileRecord | null;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function ensureProfile(user: User) {
  const store = getClientDb();
  if (!store) return;
  const userRef = doc(store, COLLECTIONS.users, user.uid);
  const existing = await getDoc(userRef);
  if (!existing.exists()) {
    await setDoc(userRef, {
      email: user.email || "",
      displayName: user.displayName || "",
      plan: "free",
      createdAt: serverTimestamp(),
      createdAtMs: Date.now(),
    });
  }
  const profileRef = doc(store, COLLECTIONS.profiles, user.uid);
  const profile = await getDoc(profileRef);
  if (!profile.exists()) {
    await setDoc(profileRef, {
      displayName: user.displayName || "",
      school: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
}

async function readProfile(user: User): Promise<ProfileRecord | null> {
  const store = getClientDb();
  if (!store) return null;
  const snap = await getDoc(doc(store, COLLECTIONS.profiles, user.uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    displayName: String(data.displayName || user.displayName || ""),
    school: String(data.school || ""),
    ageConfirmed: data.ageConfirmed === true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseClientConfigured();
  const [ready, setReady] = useState(!configured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    const current = getClientAuth()?.currentUser;
    if (!current) {
      setProfile(null);
      return;
    }
    setProfile(await readProfile(current));
  }, []);

  const refreshUser = useCallback(async () => {
    const auth = getClientAuth();
    await auth?.currentUser?.reload();
    setUser(auth?.currentUser ? auth.currentUser : null);
  }, []);

  useEffect(() => {
    if (!configured) return;
    const auth = getClientAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      if (!next) {
        setProfile(null);
        setProfileError(null);
        setReady(true);
        return;
      }
      ensureProfile(next)
        .then(() => readProfile(next))
        .then((nextProfile) => {
          setProfile(nextProfile);
          setProfileError(null);
        })
        .catch((error) => setProfileError(friendlyFirebaseError(error)))
        .finally(() => setReady(true));
    });
  }, [configured]);

  const value = useMemo<AuthState>(
    () => ({ ready, configured, user, profile, profileError, refreshProfile, refreshUser }),
    [ready, configured, user, profile, profileError, refreshProfile, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
