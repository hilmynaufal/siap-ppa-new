"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { tandaiDibaca } from "@/lib/jadwal";
import { ubahStatusSesi, type HasilSesi, type StatusSesi } from "@/lib/sesi";

export async function tandaiSemuaDibaca() {
  const pengguna = await wajibPeran("PENDAMPING");
  await tandaiDibaca(db, pengguna.id);
  revalidatePath("/pendamping");
}

const TARGET: StatusSesi[] = ["BERLANGSUNG", "SELESAI", "TIDAK_HADIR"];

/** Pendamping mengubah status sesinya sendiri (Berlangsung, Selesai, Tidak hadir). */
export async function ubahStatus(sesiId: string, target: string): Promise<HasilSesi> {
  const pengguna = await wajibPeran("PENDAMPING");
  if (!TARGET.includes(target as StatusSesi)) return { ok: false, pesan: "Status tidak dikenal." };
  const hasil = await ubahStatusSesi(db, String(sesiId ?? ""), pengguna.id, target as StatusSesi);
  if (hasil.ok) {
    // Daftar Pendamping, detail laporan Admin, jadwal Admin, dan Cek Tiket Pelapor membaca data yang sama.
    for (const p of ["/pendamping", "/admin/jadwal", "/admin/laporan"]) revalidatePath(p, "layout");
  }
  return hasil;
}
