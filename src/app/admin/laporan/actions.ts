"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { bukaNik, cariLaporanByNik, type HasilBukaNik, type HasilCariNik, type PihakNik } from "@/lib/nik-akses";
import { BIDANG_JADWAL, type GalatJadwal } from "@/lib/tiket";
import { tolakLaporan, verifikasiLaporan, type HasilVerifikasi } from "@/lib/verifikasi";

export type AksiVerifikasi =
  | { ok?: boolean; pesan?: string; alasan?: string; galat?: GalatJadwal; nilai?: Record<string, string> }
  | undefined;

function selesai(hasil: HasilVerifikasi, id: string, alasan?: string, nilai?: Record<string, string>): AksiVerifikasi {
  if (!hasil.ok) return { pesan: hasil.pesan, alasan, galat: hasil.galat, nilai };
  // Daftar dan detail membaca status dari basis data; segarkan agar langsung tampil.
  revalidatePath("/admin/laporan");
  revalidatePath(`/admin/laporan/${id}`);
  revalidatePath("/pendamping");
  return { ok: true };
}

export async function verifikasi(_s: AksiVerifikasi, fd: FormData): Promise<AksiVerifikasi> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const nilai = Object.fromEntries(BIDANG_JADWAL.map((k) => [k, String(fd.get(k) ?? "")]));
  return selesai(await verifikasiLaporan(db, id, admin.id, nilai), id, undefined, nilai);
}

export async function tolak(_s: AksiVerifikasi, fd: FormData): Promise<AksiVerifikasi> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const alasan = String(fd.get("alasan") ?? "");
  return selesai(await tolakLaporan(db, id, admin.id, alasan), id, alasan);
}

/** Membuka NIK utuh (tercatat di audit). Hanya Admin. */
export async function tampilkanNik(laporanId: string, pihak: PihakNik): Promise<HasilBukaNik> {
  const admin = await wajibPeran("ADMIN");
  if (pihak !== "KORBAN" && pihak !== "PELAPOR") return { ok: false, pesan: "Pihak tidak dikenal." };
  return bukaNik(db, String(laporanId ?? ""), pihak, admin.id);
}

/** Mencari laporan lewat NIK (tercatat di audit). Hanya Admin. */
export async function cariNik(nik: string): Promise<HasilCariNik> {
  const admin = await wajibPeran("ADMIN");
  return cariLaporanByNik(db, String(nik ?? "").slice(0, 40), admin.id);
}
