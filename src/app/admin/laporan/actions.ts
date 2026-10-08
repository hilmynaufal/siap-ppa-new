"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { bukaNik, cariLaporanByNik, type HasilBukaNik, type HasilCariNik, type PihakNik } from "@/lib/nik-akses";
import { BIDANG_JADWAL, type GalatJadwal } from "@/lib/tiket";
import { batalkanSesi, tambahSesi, tutupKasus, type HasilSesi } from "@/lib/sesi";
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

export type AksiSesi = { ok?: boolean; pesan?: string; galat?: GalatJadwal; alasan?: string } | undefined;

function segarkan(laporanId: string) {
  for (const p of [`/admin/laporan/${laporanId}`, "/admin/laporan", "/admin/jadwal", "/pendamping"]) revalidatePath(p, "layout");
}

function hasilSesi(h: HasilSesi, laporanId: string, alasan?: string): AksiSesi {
  if (!h.ok) return { pesan: h.pesan, galat: h.galat, alasan };
  segarkan(laporanId);
  return { ok: true };
}

/** Admin menambah sesi pendampingan pada laporan yang sama. */
export async function tambahSesiAksi(_s: AksiSesi, fd: FormData): Promise<AksiSesi> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const nilai = Object.fromEntries(BIDANG_JADWAL.map((k) => [k, String(fd.get(k) ?? "")]));
  return hasilSesi(await tambahSesi(db, id, admin.id, nilai), id);
}

/** Admin membatalkan sesi yang belum dimulai, dengan alasan. */
export async function batalkanSesiAksi(_s: AksiSesi, fd: FormData): Promise<AksiSesi> {
  const admin = await wajibPeran("ADMIN");
  const laporanId = String(fd.get("laporanId") ?? "");
  const alasan = String(fd.get("alasan") ?? "");
  return hasilSesi(await batalkanSesi(db, String(fd.get("sesiId") ?? ""), admin.id, alasan), laporanId, alasan);
}

/** Admin menutup kasus setelah seluruh sesi selesai. */
export async function tutupKasusAksi(_s: AksiSesi, fd: FormData): Promise<AksiSesi> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  return hasilSesi(await tutupKasus(db, id, admin.id), id);
}
