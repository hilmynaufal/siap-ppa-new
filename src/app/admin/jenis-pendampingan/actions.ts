"use server";

import { revalidatePath } from "next/cache";
import type { AksiMaster } from "@/components/master-ui";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  alihkanAktifMaster,
  hapusJenisPendampingan,
  tambahJenisPendampingan,
  ubahJenisPendampingan,
  type HasilMaster,
} from "@/lib/master-layanan";

const ambil = (fd: FormData) => ({ kode: String(fd.get("kode") ?? ""), nama: String(fd.get("nama") ?? "") });

async function selesai(h: HasilMaster, adminId: string, aksi: string, entitasId: string, nilai?: Record<string, string>): Promise<AksiMaster> {
  if (!h.ok) return { pesan: h.pesan, galat: h.galat, nilai };
  await db.logAudit.create({ data: { penggunaId: adminId, aksi, entitas: "JenisPendampingan", entitasId } });
  // Dipakai juga oleh pilihan jadwal di halaman verifikasi laporan.
  for (const p of ["/admin/jenis-pendampingan", "/admin/laporan"]) revalidatePath(p, "layout");
  return { ok: true };
}

export async function tambah(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const nilai = ambil(fd);
  return selesai(await tambahJenisPendampingan(db, nilai), admin.id, "TAMBAH_JENIS_PENDAMPINGAN", nilai.kode, nilai);
}

export async function ubah(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const nilai = ambil(fd);
  return selesai(await ubahJenisPendampingan(db, id, nilai, fd.get("aktif") === "on"), admin.id, "UBAH_JENIS_PENDAMPINGAN", id, nilai);
}

export async function hapus(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  return selesai(await hapusJenisPendampingan(db, id), admin.id, "HAPUS_JENIS_PENDAMPINGAN", id);
}

export async function alihkan(id: string, aktif: boolean): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  return selesai(
    await alihkanAktifMaster(db, "jenisPendampingan", id, aktif),
    admin.id,
    aktif ? "AKTIFKAN_JENIS_PENDAMPINGAN" : "NONAKTIFKAN_JENIS_PENDAMPINGAN",
    id,
  );
}
