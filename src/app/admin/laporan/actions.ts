"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { tolakLaporan, verifikasiLaporan, type HasilVerifikasi } from "@/lib/verifikasi";

export type AksiVerifikasi = { ok?: boolean; pesan?: string; alasan?: string } | undefined;

function selesai(hasil: HasilVerifikasi, id: string, alasan?: string): AksiVerifikasi {
  if (!hasil.ok) return { pesan: hasil.pesan, alasan };
  // Daftar dan detail membaca status dari basis data; segarkan agar langsung tampil.
  revalidatePath("/admin/laporan");
  revalidatePath(`/admin/laporan/${id}`);
  return { ok: true };
}

export async function verifikasi(_s: AksiVerifikasi, fd: FormData): Promise<AksiVerifikasi> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  return selesai(await verifikasiLaporan(db, id, admin.id), id);
}

export async function tolak(_s: AksiVerifikasi, fd: FormData): Promise<AksiVerifikasi> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const alasan = String(fd.get("alasan") ?? "");
  return selesai(await tolakLaporan(db, id, admin.id, alasan), id, alasan);
}
