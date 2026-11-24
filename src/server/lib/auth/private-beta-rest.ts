/**
 * Firebase Auth REST account lookup is the authentication authority here.
 * https://firebase.google.com/docs/reference/rest/auth/#section-get-account-info
 * Only inspect claims after Google's endpoint accepts the exact ID token.
 * No use of client identity headers, third-party JWT decoders or admin keys.
 * This is a private beta identity check, not general admin authentication.
 */
export async function verifyPrivateBetaRestIdentity(token: string, ownerEmail: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId || !token || token.length > 8192) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) return null;
    const url = new URL("https://identitytoolkit.googleapis.com/v1/accounts:lookup");
    url.searchParams.set("key", apiKey);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const result: unknown = await res.json();
    if (!result || typeof result !== "object" || !("users" in result) ||
        !Array.isArray(result.users) || result.users.length !== 1) return null;
    const account = result.users[0];
    if (!account || typeof account.localId !== "string" || !account.localId ||
        typeof account.email !== "string" || account.email.toLowerCase() !== ownerEmail ||
        account.emailVerified !== true || account.disabled === true) return null;
    // The authenticated response is for the exact token sent to Google.
    // Check project, subject, timestamps and revocation boundary as defense in depth.
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (!header || header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid ||
        !claims || claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}` ||
        claims.sub !== account.localId || claims.email_verified !== true ||
        typeof claims.email !== "string" || claims.email.toLowerCase() !== ownerEmail ||
        !Number.isSafeInteger(claims.exp) || claims.exp <= now ||
        !Number.isSafeInteger(claims.iat) || claims.iat > now ||
        !Number.isSafeInteger(claims.auth_time) || claims.auth_time > claims.iat ||
        claims.auth_time <= 0) return null;
    if (typeof account.validSince !== "string" || !/^\d+$/.test(account.validSince)) return null;
    const validSince = Number(account.validSince);
    if (!Number.isSafeInteger(validSince) || claims.auth_time < validSince) return null;
    return account.localId;
  } catch {
    return null;
  }
}
