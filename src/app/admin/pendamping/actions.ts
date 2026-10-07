"use server";

import { revalidatePath } from "next/cache";
import type { AksiMaster } from "@/components/master-ui";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { alihkanAktifMaster, aturUlangKataSandi, tambahPendamping, ubahPendamping, type HasilMaster } from "@/lib/master-layanan";

const ambil = (fd: FormData) => ({
  nama: String(fd.get("nama") ?? ""),
  email: String(fd.get("email") ?? ""),
  jenisPendampingId: String(fd.get("jenisPendampingId") ?? ""),
});

async function selesai(h: HasilMaster, adminId: string, aksi: string, entitasId: string, nilai?: Record<string, string>, email?: string): Promise<AksiMaster> {
  if (!h.ok) return { pesan: h.pesan, galat: h.galat, nilai };
  // Kata sandi sementara tidak pernah dicatat; hanya dikembalikan sekali ke Admin yang membuatnya.
  await db.logAudit.create({ data: { penggunaId: adminId, aksi, entitas: "Pengguna", entitasId } });
  for (const p of ["/admin/pendamping", "/admin/laporan", "/admin/jadwal"]) revalidatePath(p, "layout");
  return { ok: true, kataSandi: h.kataSandi, email, nilai };
}

export async function tambah(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const nilai = ambil(fd);
  const h = await tambahPendamping(db, nilai);
  return selesai(h, admin.id, "TAMBAH_PENDAMPING", h.ok && h.id ? h.id : nilai.email, nilai, nilai.email.trim().toLowerCase());
}

export async function ubah(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const nilai = ambil(fd);
  return selesai(await ubahPendamping(db, id, nilai, fd.get("aktif") === "on"), admin.id, "UBAH_PENDAMPING", id, nilai);
}

export async function aturUlangSandi(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const email = String(fd.get("email") ?? "");
  return selesai(await aturUlangKataSandi(db, id), admin.id, "ATUR_ULANG_SANDI_PENDAMPING", id, undefined, email);
}

export async function alihkan(id: string, aktif: boolean): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  return selesai(await alihkanAktifMaster(db, "pendamping", id, aktif), admin.id, aktif ? "AKTIFKAN_PENDAMPING" : "NONAKTIFKAN_PENDAMPING", id);
}
