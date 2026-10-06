"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { hapusJenis, tambahJenis, ubahJenis, type Hasil } from "@/lib/jenis-kekerasan";

export type AksiState = { ok?: boolean; pesan?: string; nilai?: string } | undefined;

async function selesai(
  hasil: Hasil,
  penggunaId: string,
  aksi: string,
  entitasId: string,
  nilai: string,
): Promise<AksiState> {
  if (!hasil.ok) return { pesan: hasil.pesan, nilai };
  await db.logAudit.create({ data: { penggunaId, aksi, entitas: "JenisKekerasan", entitasId } });
  revalidatePath("/admin/jenis-kekerasan");
  return { ok: true };
}

export async function tambah(_s: AksiState, formData: FormData): Promise<AksiState> {
  const admin = await wajibPeran("ADMIN");
  const nama = String(formData.get("nama") ?? "");
  return selesai(await tambahJenis(db, nama, admin.id), admin.id, "TAMBAH_JENIS_KEKERASAN", nama.trim(), nama);
}

export async function ubah(_s: AksiState, formData: FormData): Promise<AksiState> {
  const admin = await wajibPeran("ADMIN");
  const id = String(formData.get("id") ?? "");
  const nama = String(formData.get("nama") ?? "");
  const hasil = await ubahJenis(db, id, nama, formData.get("aktif") === "on");
  return selesai(hasil, admin.id, "UBAH_JENIS_KEKERASAN", id, nama);
}

export async function hapus(_s: AksiState, formData: FormData): Promise<AksiState> {
  const admin = await wajibPeran("ADMIN");
  const id = String(formData.get("id") ?? "");
  return selesai(await hapusJenis(db, id), admin.id, "HAPUS_JENIS_KEKERASAN", id, "");
}
