"use server";

import { revalidatePath } from "next/cache";
import type { AksiMaster } from "@/components/master-ui";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import type { HasilMaster } from "@/lib/master-layanan";
import { alihkanReferensi, hapusReferensi, tambahReferensi, ubahReferensi } from "@/lib/referensi";

const JENIS = "pekerjaan" as const;
const ambil = (fd: FormData) => ({ nama: String(fd.get("nama") ?? ""), urutan: String(fd.get("urutan") ?? "") });

async function selesai(h: HasilMaster, adminId: string, aksi: string, entitasId: string, nilai?: Record<string, string>): Promise<AksiMaster> {
  if (!h.ok) return { pesan: h.pesan, galat: h.galat, nilai };
  await db.logAudit.create({ data: { penggunaId: adminId, aksi, entitas: "Pekerjaan", entitasId } });
  revalidatePath("/admin/pekerjaan", "layout");
  revalidatePath("/lapor", "layout");
  return { ok: true };
}

export async function tambah(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const nilai = ambil(fd);
  return selesai(await tambahReferensi(db, JENIS, nilai), admin.id, "TAMBAH_PEKERJAAN", nilai.nama.trim(), nilai);
}

export async function ubah(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const nilai = ambil(fd);
  return selesai(await ubahReferensi(db, JENIS, id, nilai, fd.get("aktif") === "on"), admin.id, "UBAH_PEKERJAAN", id, nilai);
}

export async function hapus(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  return selesai(await hapusReferensi(db, JENIS, id), admin.id, "HAPUS_PEKERJAAN", id);
}

export async function alihkan(id: string, aktif: boolean): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  return selesai(await alihkanReferensi(db, JENIS, id, aktif), admin.id, aktif ? "AKTIFKAN_PEKERJAAN" : "NONAKTIFKAN_PEKERJAAN", id);
}
