"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { imporKontak, MAKS_BYTE_IMPOR, periksaImporKontak, type PratinjauImpor } from "@/lib/impor-kontak";
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

export type AksiImpor = { pratinjau?: PratinjauImpor; pesan?: string; selesai?: { ditambah: number; dilewati: number } } | undefined;

async function bacaBerkas(fd: FormData): Promise<{ teks: string } | { pesan: string }> {
  const f = fd.get("berkas");
  if (!(f instanceof File) || f.size === 0) return { pesan: "Pilih berkas CSV terlebih dahulu." };
  if (f.size > MAKS_BYTE_IMPOR) return { pesan: `Berkas terlalu besar (maksimal ${MAKS_BYTE_IMPOR / 1024} KB).` };
  if (!/\.(csv|txt)$/i.test(f.name)) return { pesan: "Berkas harus berformat CSV (.csv)." };
  return { teks: new TextDecoder("utf-8").decode(await f.arrayBuffer()) };
}

/** Memeriksa berkas tanpa menyimpan apa pun. */
export async function pratinjauImpor(_s: AksiImpor, fd: FormData): Promise<AksiImpor> {
  await wajibPeran("ADMIN");
  const b = await bacaBerkas(fd);
  if ("pesan" in b) return { pesan: b.pesan };
  return { pratinjau: await periksaImporKontak(db, b.teks) };
}

/** Menyimpan seluruh berkas bila semua baris lolos pemeriksaan. */
export async function jalankanImpor(_s: AksiImpor, fd: FormData): Promise<AksiImpor> {
  const admin = await wajibPeran("ADMIN");
  const b = await bacaBerkas(fd);
  if ("pesan" in b) return { pesan: b.pesan };
  const h = await imporKontak(db, b.teks, admin.id);
  if (!h.ok) return { pratinjau: h.pratinjau };
  await db.logAudit.create({ data: { penggunaId: admin.id, aksi: "IMPOR_KONTAK_DARURAT", entitas: "KontakDarurat", entitasId: "impor", rincian: { ditambah: h.ditambah, dilewati: h.dilewati } } });
  for (const p of ["/admin/kontak-darurat", "/", "/kontak-darurat"]) revalidatePath(p);
  return { selesai: { ditambah: h.ditambah, dilewati: h.dilewati }, pratinjau: h.pratinjau };
}
