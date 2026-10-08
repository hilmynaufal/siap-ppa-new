"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkInTiket, lewatiTiket, panggilBerikutnya } from "@/lib/antrean";
import type { HasilAksiAntrean } from "../admin/antrean/actions";

const teks = (v: unknown, maks = 100) => String(v ?? "").slice(0, maks);
const TANPA_LOKASI: HasilAksiAntrean = { ok: false, pesan: "Akun Anda belum terikat pada lokasi tugas. Hubungi Admin." };

/** Petugas hanya memproses tiket di lokasinya; lokasi dibaca dari akun, bukan dari kiriman klien. */
export async function checkInAksi(masukan: string): Promise<HasilAksiAntrean> {
  const p = await wajibPeran("PETUGAS");
  if (!p.lokasiId) return TANPA_LOKASI;
  const h = await checkInTiket(db, teks(masukan), p.id, new Date(), p.lokasiId);
  if (h.ok) revalidatePath("/petugas");
  return h;
}

export async function panggilAksi(lokasiId: string, jenisPendampingId: string, tanggal: string): Promise<HasilAksiAntrean> {
  const p = await wajibPeran("PETUGAS");
  if (!p.lokasiId) return TANPA_LOKASI;
  const h = await panggilBerikutnya(db, { lokasiId: teks(lokasiId), jenisPendampingId: teks(jenisPendampingId), tanggal: teks(tanggal, 10) }, p.id, new Date(), p.lokasiId);
  if (h.ok) revalidatePath("/petugas");
  return h;
}

export async function lewatiAksi(tiketId: string): Promise<HasilAksiAntrean> {
  const p = await wajibPeran("PETUGAS");
  if (!p.lokasiId) return TANPA_LOKASI;
  const h = await lewatiTiket(db, teks(tiketId), p.id, new Date(), p.lokasiId);
  if (h.ok) revalidatePath("/petugas");
  return h;
}
