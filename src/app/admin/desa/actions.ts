"use server";

import { revalidatePath } from "next/cache";
import type { AksiMaster } from "@/components/master-ui";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { hapusDesa, imporDesa, periksaImporDesa, tambahDesa, ubahDesa, type PratinjauDesa } from "@/lib/desa";
import { MAKS_BYTE_IMPOR } from "@/lib/impor-kontak";
import type { HasilMaster } from "@/lib/master-layanan";

const ambil = (fd: FormData) => ({
  kecamatanId: String(fd.get("kecamatanId") ?? ""),
  nama: String(fd.get("nama") ?? ""),
  kode: String(fd.get("kode") ?? ""),
});

async function selesai(h: HasilMaster, adminId: string, aksi: string, entitasId: string, nilai?: Record<string, string>): Promise<AksiMaster> {
  if (!h.ok) return { pesan: h.pesan, galat: h.galat, nilai };
  await db.logAudit.create({ data: { penggunaId: adminId, aksi, entitas: "Desa", entitasId } });
  revalidatePath("/admin/desa", "layout");
  revalidatePath("/lapor", "layout");
  return { ok: true };
}

export async function tambah(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const nilai = ambil(fd);
  return selesai(await tambahDesa(db, nilai), admin.id, "TAMBAH_DESA", nilai.nama.trim(), nilai);
}

export async function ubah(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const nilai = ambil(fd);
  return selesai(await ubahDesa(db, id, nilai), admin.id, "UBAH_DESA", id, nilai);
}

export async function hapus(_s: AksiMaster, fd: FormData): Promise<AksiMaster> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  return selesai(await hapusDesa(db, id), admin.id, "HAPUS_DESA", id);
}

export type AksiImporDesa = { pratinjau?: PratinjauDesa; pesan?: string; selesai?: { ditambah: number; dilewati: number } } | undefined;

async function bacaBerkas(fd: FormData): Promise<{ teks: string } | { pesan: string }> {
  const f = fd.get("berkas");
  if (!(f instanceof File) || f.size === 0) return { pesan: "Pilih berkas CSV terlebih dahulu." };
  if (f.size > MAKS_BYTE_IMPOR) return { pesan: `Berkas terlalu besar (maksimal ${MAKS_BYTE_IMPOR / 1024} KB).` };
  if (!/\.(csv|txt)$/i.test(f.name)) return { pesan: "Berkas harus berformat CSV (.csv)." };
  return { teks: new TextDecoder("utf-8").decode(await f.arrayBuffer()) };
}

/** Memeriksa berkas tanpa menyimpan apa pun. */
export async function pratinjauImpor(_s: AksiImporDesa, fd: FormData): Promise<AksiImporDesa> {
  await wajibPeran("ADMIN");
  const b = await bacaBerkas(fd);
  if ("pesan" in b) return { pesan: b.pesan };
  return { pratinjau: await periksaImporDesa(db, b.teks) };
}

/** Menyimpan seluruh berkas bila semua baris lolos pemeriksaan. */
export async function jalankanImpor(_s: AksiImporDesa, fd: FormData): Promise<AksiImporDesa> {
  const admin = await wajibPeran("ADMIN");
  const b = await bacaBerkas(fd);
  if ("pesan" in b) return { pesan: b.pesan };
  const h = await imporDesa(db, b.teks);
  if (!h.ok) return { pratinjau: h.pratinjau };
  await db.logAudit.create({ data: { penggunaId: admin.id, aksi: "IMPOR_DESA", entitas: "Desa", entitasId: "impor", rincian: { ditambah: h.ditambah, dilewati: h.dilewati } } });
  revalidatePath("/admin/desa", "layout");
  revalidatePath("/lapor", "layout");
  return { selesai: { ditambah: h.ditambah, dilewati: h.dilewati } };
}
