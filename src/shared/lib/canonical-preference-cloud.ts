import { initFirebase } from "@/shared/lib/firebase";

export type CanonicalPreferenceValues = Record<string, string>;

/** Encode untrusted title IDs before using them as nested Firestore field names. */
export function canonicalPreferenceFieldKey(canonicalId: string): string {
  if (!canonicalId || canonicalId.length > 700 || canonicalId.includes("\0")) {
    throw new Error("Invalid canonical preference identifier");
  }
  return encodeURIComponent(canonicalId).replace(/\./g, "%2E");
}

export function decodeCanonicalPreferenceMap(raw: unknown): CanonicalPreferenceValues {
  const clean: CanonicalPreferenceValues = Object.create(null) as CanonicalPreferenceValues;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return clean;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "string" || !value.trim()) continue;
    try {
      const id = decodeURIComponent(key);
      if (canonicalPreferenceFieldKey(id) === key) clean[id] = value;
    } catch {
      // Ignore malformed/unrecognized cloud keys.
    }
  }
  return clean;
}

export function encodeCanonicalPreferenceMap(values: CanonicalPreferenceValues): Record<string, string> {
  const out: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [id, sourceId] of Object.entries(values)) {
    if (typeof sourceId === "string" && sourceId.trim()) out[canonicalPreferenceFieldKey(id)] = sourceId;
  }
  return out;
}

async function getAuthenticatedFirestore(uid: string) {
  const { auth, db } = await initFirebase();
  if (!uid || !auth || !db || auth.currentUser?.uid !== uid) {
    throw new Error("Authenticated account changed during canonical preference sync");
  }
  return { auth, db };
}

/** Only one owner document is read; no provider API fan-out. */
export async function readCanonicalPreferredSources(uid: string): Promise<CanonicalPreferenceValues> {
  const { auth, db } = await getAuthenticatedFirestore(uid);
  const { doc, getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(db, "users", uid, "preferences", "canonicalSources"));
  if (auth.currentUser?.uid !== uid) throw new Error("Account changed during preference read");
  return decodeCanonicalPreferenceMap(snap.data()?.values);
}

/** One merge-field write per changed title: unrelated preferences are not replaced. */
export async function writeCanonicalPreferredSource(uid: string, canonicalId: string, sourceId: string | null): Promise<void> {
  const { auth, db } = await getAuthenticatedFirestore(uid);
  const { doc, setDoc, deleteField, serverTimestamp } = await import("firebase/firestore");
  const key = canonicalPreferenceFieldKey(canonicalId);
  const payload = {
    values: { [key]: sourceId && sourceId.trim() ? sourceId : deleteField() },
    schemaVersion: 1,
    updatedAt: serverTimestamp(),
  };
  if (auth.currentUser?.uid !== uid) throw new Error("Account changed before preference write");
  await setDoc(doc(db, "users", uid, "preferences", "canonicalSources"), payload, { merge: true });
  if (auth.currentUser?.uid !== uid) throw new Error("Account changed after preference write");
}

/**
 * Guest merge is optimistic-concurrency protected: fail closed if cloud changed
 * since the decision dialog was prepared. Caller must re-fetch and ask again.
 */
export async function commitCanonicalPreferredSources(
  uid: string,
  resolved: CanonicalPreferenceValues,
  expectedCloud: CanonicalPreferenceValues,
): Promise<void> {
  const { auth, db } = await getAuthenticatedFirestore(uid);
  const { doc, runTransaction, serverTimestamp } = await import("firebase/firestore");
  const ref = doc(db, "users", uid, "preferences", "canonicalSources");
  await runTransaction(db, async transaction => {
    if (auth.currentUser?.uid !== uid) throw new Error("Account changed during guest preference merge");
    const current = decodeCanonicalPreferenceMap((await transaction.get(ref)).data()?.values);
    const signature = (values: CanonicalPreferenceValues) =>
      JSON.stringify(Object.entries(values).sort(([a], [b]) => a.localeCompare(b)));
    if (signature(current) !== signature(expectedCloud)) {
      throw new Error("CANONICAL_PREFERENCE_STALE_SNAPSHOT");
    }
    transaction.set(ref, {
      values: encodeCanonicalPreferenceMap(resolved),
      schemaVersion: 1,
      updatedAt: serverTimestamp(),
    });
  });
  if (auth.currentUser?.uid !== uid) throw new Error("Account changed after guest preference merge");
}
