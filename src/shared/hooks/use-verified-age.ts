import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

export type VerifiedAgeStatus = "checking" | "verified" | "unverified";

interface AgeSnapshot { uid: string; status: VerifiedAgeStatus }

/** UI state only. The backend verifies Firebase-signed age claims on every request. */
export function useVerifiedAge(user: User | null): VerifiedAgeStatus {
  const [snapshot, setSnapshot] = useState<AgeSnapshot>({ uid: "", status: "checking" });
  const uid = user?.uid ?? "";

  useEffect(() => {
    let active = true;
    const update = (status: VerifiedAgeStatus) => {
      if (active) setSnapshot({ uid, status });
    };
    if (!user || typeof user.getIdTokenResult !== "function") {
      queueMicrotask(() => update("unverified"));
      return () => { active = false; };
    }
    queueMicrotask(() => update("checking"));
    void user.getIdTokenResult(true).then((token) => {
      update(token.claims.age_verified === true ? "verified" : "unverified");
    }).catch(() => update("unverified"));
    return () => { active = false; };
  }, [user, uid]);

  if (!user) return "unverified";
  return snapshot.uid === uid ? snapshot.status : "checking";
}
