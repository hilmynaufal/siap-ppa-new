"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { BIDANG_UBAH, riwayatJadwal, ubahJadwal, type GalatUbah } from "@/lib/jadwal";

export type AksiJadwal = { ok?: boolean; pesan?: string; galat?: GalatUbah; ringkasan?: string } | undefined;

export async function ubah(_s: AksiJadwal, fd: FormData): Promise<AksiJadwal> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const nilai = Object.fromEntries(BIDANG_UBAH.map((k) => [k, String(fd.get(k) ?? "")]));
  const hasil = await ubahJadwal(db, id, admin.id, nilai);
  if (!hasil.ok) return { pesan: hasil.pesan, galat: hasil.galat };
  // Jadwal Admin, daftar sesi Pendamping, dan Cek Tiket Pelapor membaca data yang sama.
  for (const p of ["/admin/jadwal", "/pendamping", "/admin/laporan"]) revalidatePath(p);
  return { ok: true, ringkasan: hasil.ringkasan };
}

export async function muatRiwayat(sesiId: string) {
  await wajibPeran("ADMIN");
  return riwayatJadwal(db, String(sesiId ?? ""));
}
