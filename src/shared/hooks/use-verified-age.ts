import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

export type VerifiedAgeStatus = "checking" | "verified" | "unverified";

/** UI indication only. Actual access is enforced by Firebase Admin on the server. */
export function useVerifiedAge(user: User | null): VerifiedAgeStatus {
  const [status, setStatus] = useState<VerifiedAgeStatus>("checking");

  useEffect(() => {
    let current = true;
    if (!user) {
      queueMicrotask(() => { if (current) setStatus("unverified"); });
      return () => { current = false; };
    }
    queueMicrotask(() => { if (current) setStatus("checking"); });
    void user.getIdTokenResult(true).then((token) => {
      if (current) setStatus(token.claims.age_verified === true ? "verified" : "unverified");
    }).catch(() => {
      if (current) setStatus("unverified");
    });
    return () => { current = false; };
  }, [user]);

  return status;
}
