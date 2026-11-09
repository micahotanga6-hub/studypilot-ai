"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { getClientDb } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/collections";
import { emptyUsage, isPlanId, monthKey, PLANS } from "@/lib/plans";
import { friendlyFirebaseError } from "@/lib/errors";
import type { PlanId, UsageCounts } from "@/lib/types";

export function useAccount() {
  const auth = useAuth();
  const [plan, setPlan] = useState<PlanId>("free");
  const [usage, setUsage] = useState<UsageCounts>(emptyUsage());
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!auth.user) return;
    const store = getClientDb();
    if (!store) return;
    const userSnap = await getDoc(doc(store, COLLECTIONS.users, auth.user.uid));
    const value = userSnap.exists() ? userSnap.data().plan : "free";
    setPlan(isPlanId(value) ? value : "free");
    const usageSnap = await getDoc(doc(store, COLLECTIONS.usage, `${auth.user.uid}_${monthKey()}`));
    const data = usageSnap.exists() ? usageSnap.data() : {};
    setUsage({
      uploads: Number(data.uploads || 0),
      notes: Number(data.notes || 0),
      decks: Number(data.decks || 0),
      quizzes: Number(data.quizzes || 0),
      tutorMessages: Number(data.tutorMessages || 0),
      plannerGenerations: Number(data.plannerGenerations || 0),
    });
  }, [auth.user]);

  useEffect(() => {
    if (!auth.ready || !auth.user) return;
    const uid = auth.user.uid;
    const store = getClientDb();
    if (!store) return;
    let cancelled = false;
    getDoc(doc(store, COLLECTIONS.users, uid))
      .then((userSnap) => {
        if (cancelled) return null;
        const value = userSnap.exists() ? userSnap.data().plan : "free";
        setPlan(isPlanId(value) ? value : "free");
        return getDoc(doc(store, COLLECTIONS.usage, `${uid}_${monthKey()}`));
      })
      .then((usageSnap) => {
        if (cancelled || !usageSnap) return;
        const data = usageSnap.exists() ? usageSnap.data() : {};
        setUsage({
          uploads: Number(data.uploads || 0),
          notes: Number(data.notes || 0),
          decks: Number(data.decks || 0),
          quizzes: Number(data.quizzes || 0),
          tutorMessages: Number(data.tutorMessages || 0),
          plannerGenerations: Number(data.plannerGenerations || 0),
        });
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(friendlyFirebaseError(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoadedFor(uid);
      });
    return () => {
      cancelled = true;
    };
  }, [auth.ready, auth.user]);

  const accountLoading = Boolean(auth.user) && loadedFor !== auth.user?.uid;
  return { ...auth, plan, limits: PLANS[plan], usage, accountLoading, accountError: error, refreshAccount: refresh };
}
