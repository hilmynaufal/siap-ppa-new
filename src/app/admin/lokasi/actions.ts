"use server";

import { revalidatePath } from "next/cache";
import type { AksiMaster } from "@/components/master-ui";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { alihkanAktifMaster, hapusLokasi, tambahLokasi, ubahLokasi, type HasilMaster } from "@/lib/master-layanan";

const ambil = (fd: FormData) => ({ nama: String(fd.get("nama") ?? ""), alamat: String(fd.get("alamat") ?? "") });

async function selesai(h: HasilMaster, adminId: string, aksi: string, entitasId: string, nilai?: Record<string, string>): Promise<AksiMaster> {
  if (!h.ok) return { pesan: h.pesan, galat: h.galat, nilai };
  await db.logAudit.create({ data: { penggunaId: adminId, aksi, entitas: "Lokasi", entitasId } });
  for (const p of ["/admin/lokasi", "/admin/laporan"]) revalidatePath(p, "layout");
  return { ok: true };
}

export async function tambah(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const nilai = ambil(fd);
  return selesai(await tambahLokasi(db, nilai), admin.id, "TAMBAH_LOKASI", nilai.nama.trim(), nilai);
}

export async function ubah(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const nilai = ambil(fd);
  return selesai(await ubahLokasi(db, id, nilai, fd.get("aktif") === "on"), admin.id, "UBAH_LOKASI", id, nilai);
}

export async function hapus(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  return selesai(await hapusLokasi(db, id), admin.id, "HAPUS_LOKASI", id);
}

export async function alihkan(id: string, aktif: boolean): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  return selesai(await alihkanAktifMaster(db, "lokasi", id, aktif), admin.id, aktif ? "AKTIFKAN_LOKASI" : "NONAKTIFKAN_LOKASI", id);
}
