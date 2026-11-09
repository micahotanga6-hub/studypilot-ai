import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/collections";

function database() {
  const store = getClientDb();
  if (!store) throw new Error("Firebase is not configured.");
  return store;
}

export async function listByUid<T>(name: string, uid: string): Promise<T[]> {
  const snap = await getDocs(query(collection(database(), name), where("uid", "==", uid), limit(300)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

export async function listOwned<T>(name: string, uid: string): Promise<T[]> {
  const snap = await getDocs(
    query(collection(database(), name), where("uid", "==", uid), orderBy("createdAtMs", "desc"), limit(100)),
  );
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

export async function listWhere<T>(name: string, uid: string, field: string, value: string, sort: string, direction: "asc" | "desc" = "asc"): Promise<T[]> {
  const snap = await getDocs(
    query(collection(database(), name), where("uid", "==", uid), where(field, "==", value), orderBy(sort, direction), limit(100)),
  );
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

export async function getOwned<T>(name: string, id: string, uid: string): Promise<T | null> {
  const snap = await getDoc(doc(database(), name, id));
  if (!snap.exists()) return null;
  const data = { id: snap.id, ...(snap.data() as DocumentData) } as unknown as T & { uid?: string };
  if (data.uid !== uid) return null;
  return data;
}

export async function removeOwned(name: string, id: string) {
  await deleteDoc(doc(database(), name, id));
}

export async function saveFields(name: string, id: string, fields: DocumentData) {
  await updateDoc(doc(database(), name, id), fields);
}

export async function createOwned(name: string, fields: DocumentData) {
  return addDoc(collection(database(), name), {
    ...fields,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  });
}

export { COLLECTIONS };
