import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { berandaUntuk } from "./akses";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  readSecret,
  signSession,
  verifySession,
  type Peran,
} from "./session";

export type PenggunaAktif = { id: string; nama: string; email: string; peran: Peran };

export async function buatSesi(userId: string, peran: Peran) {
  const token = await signSession({ userId, peran }, readSecret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function hapusSesi() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Sesi yang sah dan penggunanya masih aktif; peran dibaca dari basis data, bukan dari cookie. */
export const penggunaSaatIni = cache(async (): Promise<PenggunaAktif | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const sesi = await verifySession(token, readSecret());
  if (!sesi) return null;
  const pengguna = await db.pengguna.findUnique({
    where: { id: sesi.userId },
    select: { id: true, nama: true, email: true, peran: true, aktif: true },
  });
  if (!pengguna || !pengguna.aktif) return null;
  return { id: pengguna.id, nama: pengguna.nama, email: pengguna.email, peran: pengguna.peran };
});

/** Dipakai di layout/halaman/aksi server: penjagaan kedua setelah proxy. */
export async function wajibPeran(...peran: Peran[]): Promise<PenggunaAktif> {
  const pengguna = await penggunaSaatIni();
  if (!pengguna) redirect("/masuk");
  if (!peran.includes(pengguna.peran)) redirect(berandaUntuk(pengguna.peran));
  return pengguna;
}
