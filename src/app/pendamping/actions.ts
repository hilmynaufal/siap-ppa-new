"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { tandaiDibaca } from "@/lib/jadwal";
import { kirimLaporanPendampingan, revisiLaporanPendampingan, type FotoMasuk } from "@/lib/laporan-pendampingan";
import type { GalatPendampingan } from "@/lib/pendampingan-skema";
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

export type AksiLaporan = { ok?: boolean; pesan?: string; galat?: GalatPendampingan } | undefined;

function segarkanLaporan() {
  for (const p of ["/pendamping", "/admin/laporan"]) revalidatePath(p, "layout");
}

async function bacaFoto(fd: FormData): Promise<FotoMasuk[]> {
  const files = fd.getAll("foto").filter((f): f is File => f instanceof File && f.size > 0);
  return Promise.all(files.map(async (f) => ({ nama: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })));
}

function bacaIsi(fd: FormData) {
  return {
    jenisPendampinganId: String(fd.get("jenisPendampinganId") ?? ""),
    keterangan: String(fd.get("keterangan") ?? ""),
    rekomendasi: String(fd.get("rekomendasi") ?? ""),
    ajukanSesiLanjutan: fd.get("ajukanSesiLanjutan") === "on",
    alasanRevisi: String(fd.get("alasanRevisi") ?? ""),
  };
}

/** Pendamping mengirim laporan pendampingan untuk sesinya; setelah dikirim laporan terkunci. */
export async function kirimLaporanAksi(_s: AksiLaporan, fd: FormData): Promise<AksiLaporan> {
  const pengguna = await wajibPeran("PENDAMPING");
  const h = await kirimLaporanPendampingan(db, String(fd.get("sesiId") ?? ""), pengguna.id, bacaIsi(fd), await bacaFoto(fd));
  if (!h.ok) return { pesan: h.pesan, galat: h.galat };
  segarkanLaporan();
  return { ok: true };
}

/** Pendamping merevisi laporannya yang terkunci, dengan alasan yang tercatat. */
export async function revisiLaporanAksi(_s: AksiLaporan, fd: FormData): Promise<AksiLaporan> {
  const pengguna = await wajibPeran("PENDAMPING");
  const hapus = fd.getAll("hapusFoto").map(String);
  const h = await revisiLaporanPendampingan(db, String(fd.get("sesiId") ?? ""), pengguna.id, bacaIsi(fd), await bacaFoto(fd), hapus);
  if (!h.ok) return { pesan: h.pesan, galat: h.galat };
  segarkanLaporan();
  return { ok: true };
}
