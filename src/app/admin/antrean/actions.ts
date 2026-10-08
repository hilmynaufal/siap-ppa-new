"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkInTiket, lewatiTiket, panggilBerikutnya, type HasilAntrean } from "@/lib/antrean";

export type HasilAksiAntrean = HasilAntrean<{ nomorAntrean?: string; jam?: string }>;

const teks = (v: unknown, maks = 100) => String(v ?? "").slice(0, maks);

/** Petugas check-in: kode dari pemindai QR atau diketik (kode tiket atau nomor antrean). */
export async function checkInAksi(masukan: string): Promise<HasilAksiAntrean> {
  const petugas = await wajibPeran("ADMIN");
  const h = await checkInTiket(db, teks(masukan), petugas.id);
  if (h.ok) revalidatePath("/admin/antrean");
  return h;
}

export async function panggilAksi(lokasiId: string, jenisPendampingId: string, tanggal: string): Promise<HasilAksiAntrean> {
  const petugas = await wajibPeran("ADMIN");
  const h = await panggilBerikutnya(db, { lokasiId: teks(lokasiId), jenisPendampingId: teks(jenisPendampingId), tanggal: teks(tanggal, 10) }, petugas.id);
  if (h.ok) revalidatePath("/admin/antrean");
  return h;
}

export async function lewatiAksi(tiketId: string): Promise<HasilAksiAntrean> {
  const petugas = await wajibPeran("ADMIN");
  const h = await lewatiTiket(db, teks(tiketId), petugas.id);
  if (h.ok) revalidatePath("/admin/antrean");
  return h;
}
