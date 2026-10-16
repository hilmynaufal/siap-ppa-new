"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { bacaPengaturanBap, simpanPengaturanBap, type PengaturanBap } from "@/lib/pengaturan";

export type AksiPengaturan = { ok?: boolean; pesan?: string; galat?: Partial<Record<keyof PengaturanBap, string>>; nilai?: PengaturanBap } | undefined;

export async function simpanPengaturan(_s: AksiPengaturan, fd: FormData): Promise<AksiPengaturan> {
  const admin = await wajibPeran("ADMIN");
  const nilai = { kepalaUptdNama: String(fd.get("kepalaUptdNama") ?? ""), kepalaUptdNip: String(fd.get("kepalaUptdNip") ?? "") };
  const h = await simpanPengaturanBap(db, nilai, admin.id);
  if (!h.ok) return { pesan: h.pesan, galat: h.galat, nilai };
  revalidatePath("/admin/pengaturan");
  // Nilai tersimpan (NIP tanpa spasi) dikembalikan agar formulir menampilkan bentuk akhirnya.
  return { ok: true, pesan: "Pengaturan tersimpan.", nilai: await bacaPengaturanBap(db) };
}
