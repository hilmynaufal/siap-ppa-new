import * as z from "zod";
import type { PrismaClient } from "@/generated/prisma/client";

/** Kontak darurat yang aktif, untuk tombol Darurat dan daftar singkat di beranda Pelapor. */
export async function kontakDaruratAktif(db: PrismaClient, jumlah = 3) {
  return db.kontakDarurat.findMany({
    where: { aktif: true },
    // Tingkat kabupaten (tanpa kecamatan) lebih dulu, lalu menurut nama.
    orderBy: [{ kecamatanId: { sort: "asc", nulls: "first" } }, { instansi: "asc" }],
    take: jumlah,
    select: { id: true, instansi: true, telepon: true, alamat: true },
  });
}

/** Semua kontak aktif beserta nama kecamatan, untuk halaman daftar kontak darurat Pelapor. */
export async function kontakAktifPublik(db: PrismaClient) {
  const rows = await db.kontakDarurat.findMany({
    where: { aktif: true },
    orderBy: [{ kecamatanId: { sort: "asc", nulls: "first" } }, { instansi: "asc" }],
    include: { kecamatan: { select: { nama: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    instansi: r.instansi,
    telepon: r.telepon,
    alamat: r.alamat,
    kecamatan: r.kecamatan?.nama ?? null,
  }));
}

export const SkemaKontak = z.object({
  instansi: z
    .string({ error: "Nama instansi wajib diisi." })
    .trim()
    .min(3, { error: "Nama instansi wajib diisi (minimal 3 huruf)." })
    .max(150, { error: "Nama instansi terlalu panjang (maksimal 150 huruf)." }),
  telepon: z
    .string({ error: "Nomor telepon wajib diisi." })
    .trim()
    .min(1, { error: "Nomor telepon wajib diisi." })
    .regex(/^[+(\d][\d\s().-]{5,24}$/, { error: "Nomor telepon tidak valid. Contoh: (022) 5890 0000." }),
  alamat: z
    .string({ error: "Alamat wajib diisi." })
    .trim()
    .min(5, { error: "Alamat wajib diisi (minimal 5 huruf)." })
    .max(300, { error: "Alamat terlalu panjang (maksimal 300 huruf)." }),
  kecamatanId: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.string().nullable()),
});

export type DataKontak = z.infer<typeof SkemaKontak>;
export type GalatKontak = Partial<Record<"instansi" | "telepon" | "alamat" | "kecamatanId", string>>;
export type HasilKontak = { ok: true } | { ok: false; pesan: string; galat?: GalatKontak };

export async function daftarKontakAdmin(db: PrismaClient) {
  const rows = await db.kontakDarurat.findMany({
    orderBy: [{ kecamatanId: { sort: "asc", nulls: "first" } }, { instansi: "asc" }],
    include: { kecamatan: { select: { nama: true } }, dibuatOleh: { select: { nama: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    instansi: r.instansi,
    telepon: r.telepon,
    alamat: r.alamat,
    aktif: r.aktif,
    kecamatanId: r.kecamatanId,
    kecamatan: r.kecamatan?.nama ?? null,
    // Tanggal dikirim sebagai teks ISO agar aman melintasi batas server dan klien.
    dibuatPada: r.dibuatPada.toISOString(),
    diubahPada: r.diubahPada.toISOString(),
    dibuatOleh: r.dibuatOleh?.nama ?? null,
  }));
}

function validasi(mentah: unknown): { data: DataKontak } | { galat: GalatKontak } {
  const h = SkemaKontak.safeParse(mentah);
  if (h.success) return { data: h.data };
  const galat: GalatKontak = {};
  for (const isu of h.error.issues) {
    const k = String(isu.path[0]) as keyof GalatKontak;
    if (!(k in galat)) galat[k] = isu.message;
  }
  return { galat };
}

async function kecamatanAda(db: PrismaClient, id: string | null) {
  if (!id) return true;
  return !!(await db.kecamatan.findUnique({ where: { id }, select: { id: true } }));
}

const GALAT_UMUM = "Periksa kembali isian Anda.";

export async function tambahKontak(db: PrismaClient, mentah: unknown, dibuatOlehId: string | null = null): Promise<HasilKontak> {
  const v = validasi(mentah);
  if ("galat" in v) return { ok: false, pesan: GALAT_UMUM, galat: v.galat };
  if (!(await kecamatanAda(db, v.data.kecamatanId))) {
    return { ok: false, pesan: GALAT_UMUM, galat: { kecamatanId: "Pilih kecamatan dari daftar." } };
  }
  await db.kontakDarurat.create({ data: { ...v.data, aktif: true, dibuatOlehId } });
  return { ok: true };
}

export async function ubahKontak(db: PrismaClient, id: string, mentah: unknown, aktif: boolean): Promise<HasilKontak> {
  const v = validasi(mentah);
  if ("galat" in v) return { ok: false, pesan: GALAT_UMUM, galat: v.galat };
  if (!(await kecamatanAda(db, v.data.kecamatanId))) {
    return { ok: false, pesan: GALAT_UMUM, galat: { kecamatanId: "Pilih kecamatan dari daftar." } };
  }
  try {
    await db.kontakDarurat.update({ where: { id }, data: { ...v.data, aktif } });
  } catch (e) {
    if ((e as { code?: string }).code === "P2025") return { ok: false, pesan: "Kontak tidak ditemukan." };
    throw e;
  }
  return { ok: true };
}

export async function alihkanAktif(db: PrismaClient, id: string, aktif: boolean): Promise<HasilKontak> {
  try {
    await db.kontakDarurat.update({ where: { id }, data: { aktif } });
  } catch (e) {
    if ((e as { code?: string }).code === "P2025") return { ok: false, pesan: "Kontak tidak ditemukan." };
    throw e;
  }
  return { ok: true };
}

export async function hapusKontak(db: PrismaClient, id: string): Promise<HasilKontak> {
  try {
    await db.kontakDarurat.delete({ where: { id } });
  } catch (e) {
    if ((e as { code?: string }).code === "P2025") return { ok: false, pesan: "Kontak tidak ditemukan." };
    throw e;
  }
  return { ok: true };
}
