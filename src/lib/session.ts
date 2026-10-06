import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "siap_ppa_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type Peran = "ADMIN" | "PENDAMPING";

export type SessionPayload = {
  userId: string;
  peran: Peran;
};

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export function readSecret(source: Record<string, string | undefined> = process.env): string {
  const secret = source.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET wajib diisi (minimal 32 karakter).");
  }
  return secret;
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  return new SignJWT({ peran: payload.peran })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(key(secret));
}

/** Mengembalikan null bila token rusak, kedaluwarsa, atau tidak sah. */
export async function verifySession(
  token: string | undefined,
  secret: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    const peran = payload.peran;
    if (!payload.sub || (peran !== "ADMIN" && peran !== "PENDAMPING")) return null;
    return { userId: payload.sub, peran };
  } catch {
    return null;
  }
}
