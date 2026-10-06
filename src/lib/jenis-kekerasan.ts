import * as z from "zod";
import type { PrismaClient } from "@/generated/prisma/client";

export const NamaSchema = z
  .string()
  .trim()
  .min(2, { error: "Nama jenis wajib diisi (minimal 2 huruf)." })
  .max(100, { error: "Nama jenis terlalu panjang (maksimal 100 huruf)." });

export type Hasil = { ok: true } | { ok: false; pesan: string };

export async function daftarJenis(db: PrismaClient) {
  const rows = await db.jenisKekerasan.findMany({
    orderBy: { nama: "asc" },
    include: { _count: { select: { laporan: true } }, dibuatOleh: { select: { nama: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    aktif: r.aktif,
    jumlahLaporan: r._count.laporan,
    // Tanggal dikirim sebagai teks ISO agar aman melintasi batas server dan klien.
    dibuatPada: r.dibuatPada.toISOString(),
    diubahPada: r.diubahPada.toISOString(),
    dibuatOleh: r.dibuatOleh?.nama ?? null,
  }));
}

async function namaSudahAda(db: PrismaClient, nama: string, kecualiId?: string) {
  const ada = await db.jenisKekerasan.findFirst({
    where: { nama: { equals: nama, mode: "insensitive" }, ...(kecualiId ? { NOT: { id: kecualiId } } : {}) },
    select: { id: true },
  });
  return !!ada;
}

const pesanDuplikat = (nama: string) => `"${nama}" sudah ada. Gunakan nama lain.`;

function adalahPelanggaranUnik(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

export async function tambahJenis(
  db: PrismaClient,
  namaMentah: string,
  dibuatOlehId: string | null = null,
): Promise<Hasil> {
  const nama = NamaSchema.safeParse(namaMentah);
  if (!nama.success) return { ok: false, pesan: nama.error.issues[0].message };
  if (await namaSudahAda(db, nama.data)) return { ok: false, pesan: pesanDuplikat(nama.data) };
  try {
    await db.jenisKekerasan.create({ data: { nama: nama.data, dibuatOlehId } });
  } catch (e) {
    if (adalahPelanggaranUnik(e)) return { ok: false, pesan: pesanDuplikat(nama.data) };
    throw e;
  }
  return { ok: true };
}

export async function ubahJenis(
  db: PrismaClient,
  id: string,
  namaMentah: string,
  aktif: boolean,
): Promise<Hasil> {
  const nama = NamaSchema.safeParse(namaMentah);
  if (!nama.success) return { ok: false, pesan: nama.error.issues[0].message };
  if (await namaSudahAda(db, nama.data, id)) return { ok: false, pesan: pesanDuplikat(nama.data) };
  try {
    await db.jenisKekerasan.update({ where: { id }, data: { nama: nama.data, aktif } });
  } catch (e) {
    if (adalahPelanggaranUnik(e)) return { ok: false, pesan: pesanDuplikat(nama.data) };
    if ((e as { code?: string }).code === "P2025") return { ok: false, pesan: "Jenis kekerasan tidak ditemukan." };
    throw e;
  }
  return { ok: true };
}

/** Jenis yang sudah dipakai laporan tidak dihapus (menjaga riwayat); sarankan menonaktifkan. */
export async function hapusJenis(db: PrismaClient, id: string): Promise<Hasil> {
  const jenis = await db.jenisKekerasan.findUnique({
    where: { id },
    include: { _count: { select: { laporan: true } } },
  });
  if (!jenis) return { ok: false, pesan: "Jenis kekerasan tidak ditemukan." };
  if (jenis._count.laporan > 0) {
    return {
      ok: false,
      pesan: `"${jenis.nama}" dipakai di ${jenis._count.laporan} laporan sehingga tidak dapat dihapus. Nonaktifkan lewat Ubah agar tidak tampil di formulir.`,
    };
  }
  await db.jenisKekerasan.delete({ where: { id } });
  return { ok: true };
}
