import * as z from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import type { HasilMaster } from "./master-layanan";

/**
 * Daftar rujukan sederhana yang dipakai formulir laporan dan dikelola Admin.
 * Hubungan dengan korban dan Pekerjaan bentuknya sama, jadi memakai satu kumpulan fungsi.
 */
export type JenisReferensi = "hubungan" | "pekerjaan";

export const LABEL_REFERENSI: Record<JenisReferensi, { tunggal: string; jamak: string }> = {
  hubungan: { tunggal: "hubungan", jamak: "Hubungan dengan Korban" },
  pekerjaan: { tunggal: "pekerjaan", jamak: "Pekerjaan" },
};

export const SkemaReferensi = z.object({
  nama: z
    .string({ error: "Nama wajib diisi." })
    .trim()
    .min(2, { error: "Nama wajib diisi (minimal 2 huruf)." })
    .max(80, { error: "Nama terlalu panjang (maksimal 80 huruf)." }),
  urutan: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : v),
    z.coerce.number({ error: "Urutan harus berupa angka." }).int({ error: "Urutan harus bilangan bulat." }).min(0, { error: "Urutan 0-999." }).max(999, { error: "Urutan 0-999." }),
  ),
});

// Dua tabel ini berbentuk identik (id, nama, aktif, urutan), sehingga delegasi Prisma-nya dipakai bergantian.
function tabel(db: PrismaClient, jenis: JenisReferensi) {
  return (jenis === "hubungan" ? db.hubunganKorban : db.pekerjaan) as typeof db.hubunganKorban;
}

const kode = (e: unknown) => (typeof e === "object" && e !== null ? (e as { code?: string }).code : undefined);
const duplikat = (nama: string): HasilMaster => ({ ok: false, pesan: "Nama sudah ada.", galat: { nama: `"${nama}" sudah ada. Gunakan nama lain.` } });

export async function daftarReferensi(db: PrismaClient, jenis: JenisReferensi) {
  const rows = await tabel(db, jenis).findMany({ orderBy: [{ urutan: "asc" }, { nama: "asc" }] });
  return rows.map((r) => ({ id: r.id, nama: r.nama, aktif: r.aktif, urutan: r.urutan }));
}

/** Hanya yang aktif, untuk pilihan di formulir. */
export async function pilihanReferensi(db: PrismaClient, jenis: JenisReferensi) {
  const rows = await tabel(db, jenis).findMany({ where: { aktif: true }, orderBy: [{ urutan: "asc" }, { nama: "asc" }], select: { id: true, nama: true } });
  return rows;
}

function periksa(mentah: unknown): { ok: true; data: z.infer<typeof SkemaReferensi> } | { ok: false; hasil: HasilMaster } {
  const p = SkemaReferensi.safeParse(mentah);
  if (p.success) return { ok: true, data: p.data };
  const galat: Record<string, string> = {};
  for (const i of p.error.issues) if (!galat[String(i.path[0])]) galat[String(i.path[0])] = i.message;
  return { ok: false, hasil: { ok: false, pesan: "Lengkapi isian yang ditandai.", galat } };
}

export async function tambahReferensi(db: PrismaClient, jenis: JenisReferensi, mentah: unknown): Promise<HasilMaster> {
  const p = periksa(mentah);
  if (!p.ok) return p.hasil;
  const t = tabel(db, jenis);
  if (await t.findFirst({ where: { nama: { equals: p.data.nama, mode: "insensitive" } } })) return duplikat(p.data.nama);
  try {
    await t.create({ data: p.data });
  } catch (e) {
    if (kode(e) === "P2002") return duplikat(p.data.nama);
    throw e;
  }
  return { ok: true };
}

export async function ubahReferensi(db: PrismaClient, jenis: JenisReferensi, id: string, mentah: unknown, aktif: boolean): Promise<HasilMaster> {
  const p = periksa(mentah);
  if (!p.ok) return p.hasil;
  const t = tabel(db, jenis);
  if (await t.findFirst({ where: { nama: { equals: p.data.nama, mode: "insensitive" }, NOT: { id } } })) return duplikat(p.data.nama);
  try {
    await t.update({ where: { id }, data: { ...p.data, aktif } });
  } catch (e) {
    if (kode(e) === "P2025") return { ok: false, pesan: "Data tidak ditemukan." };
    if (kode(e) === "P2002") return duplikat(p.data.nama);
    throw e;
  }
  return { ok: true };
}

export async function alihkanReferensi(db: PrismaClient, jenis: JenisReferensi, id: string, aktif: boolean): Promise<HasilMaster> {
  try {
    await tabel(db, jenis).update({ where: { id }, data: { aktif } });
  } catch (e) {
    if (kode(e) === "P2025") return { ok: false, pesan: "Data tidak ditemukan." };
    throw e;
  }
  return { ok: true };
}

/** Data yang sudah dipakai laporan ditolak oleh batasan relasi basis data; sarankan menonaktifkan. */
export async function hapusReferensi(db: PrismaClient, jenis: JenisReferensi, id: string): Promise<HasilMaster> {
  try {
    await tabel(db, jenis).delete({ where: { id } });
  } catch (e) {
    if (kode(e) === "P2025") return { ok: false, pesan: "Data tidak ditemukan." };
    if (kode(e) === "P2003") return { ok: false, pesan: "Sudah dipakai di laporan sehingga tidak dapat dihapus. Nonaktifkan lewat Ubah agar tidak tampil di formulir." };
    throw e;
  }
  return { ok: true };
}
