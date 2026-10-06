"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { alihkanAktif, hapusKontak, tambahKontak, ubahKontak, type GalatKontak, type HasilKontak } from "@/lib/kontak-darurat";

export type AksiKontak = { ok?: boolean; pesan?: string; galat?: GalatKontak; nilai?: Record<string, string> } | undefined;

function ambil(fd: FormData) {
  return Object.fromEntries(["instansi", "telepon", "alamat", "kecamatanId"].map((k) => [k, String(fd.get(k) ?? "")]));
}

async function selesai(
  hasil: HasilKontak,
  penggunaId: string,
  aksi: string,
  entitasId: string,
  nilai?: Record<string, string>,
): Promise<AksiKontak> {
  if (!hasil.ok) return { pesan: hasil.pesan, galat: hasil.galat, nilai };
  await db.logAudit.create({ data: { penggunaId, aksi, entitas: "KontakDarurat", entitasId } });
  // Daftar Admin, beranda Pelapor, dan daftar kontak Pelapor memakai data ini.
  for (const p of ["/admin/kontak-darurat", "/", "/kontak-darurat"]) revalidatePath(p);
  return { ok: true };
}

export async function tambah(_s: AksiKontak, fd: FormData): Promise<AksiKontak> {
  const admin = await wajibPeran("ADMIN");
  const nilai = ambil(fd);
  return selesai(await tambahKontak(db, nilai, admin.id), admin.id, "TAMBAH_KONTAK_DARURAT", nilai.instansi, nilai);
}

export async function ubah(_s: AksiKontak, fd: FormData): Promise<AksiKontak> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const nilai = ambil(fd);
  return selesai(await ubahKontak(db, id, nilai, fd.get("aktif") === "on"), admin.id, "UBAH_KONTAK_DARURAT", id, nilai);
}

export async function hapus(_s: AksiKontak, fd: FormData): Promise<AksiKontak> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  return selesai(await hapusKontak(db, id), admin.id, "HAPUS_KONTAK_DARURAT", id);
}

/** Saklar Aktif di tabel: dipanggil langsung dari klien. */
export async function alihkan(id: string, aktif: boolean): Promise<AksiKontak> {
  const admin = await wajibPeran("ADMIN");
  return selesai(await alihkanAktif(db, id, aktif), admin.id, aktif ? "AKTIFKAN_KONTAK_DARURAT" : "NONAKTIFKAN_KONTAK_DARURAT", id);
}
