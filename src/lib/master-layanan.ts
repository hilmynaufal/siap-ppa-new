import { randomInt } from "node:crypto";
import * as z from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { hashPassword } from "./password";

/** Hasil umum: `kataSandi` hanya terisi saat akun dibuat atau kata sandinya diatur ulang, dan hanya ditampilkan sekali. */
export type HasilMaster =
  | { ok: true; kataSandi?: string }
  | { ok: false; pesan: string; galat?: Record<string, string> };

const unik = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
const tidakAda = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "P2025";

function galatZod(err: z.ZodError): HasilMaster {
  const galat: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "");
    if (k && !galat[k]) galat[k] = i.message;
  }
  return { ok: false, pesan: "Lengkapi isian yang ditandai.", galat };
}

// ------------------------------------------------------------------ Jenis pendampingan

export const SkemaJenisPendampingan = z.object({
  kode: z
    .string({ error: "Kode wajib diisi." })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,6}$/, { error: "Kode 2-6 huruf atau angka tanpa spasi, mis. PSI." }),
  nama: z
    .string({ error: "Nama wajib diisi." })
    .trim()
    .min(3, { error: "Nama wajib diisi (minimal 3 huruf)." })
    .max(80, { error: "Nama terlalu panjang (maksimal 80 huruf)." }),
});

export async function daftarJenisPendampingan(db: PrismaClient) {
  const rows = await db.jenisPendampingan.findMany({
    orderBy: { nama: "asc" },
    include: { _count: { select: { sesi: true, pengguna: true } } },
  });
  return rows.map((r) => ({ id: r.id, kode: r.kode, nama: r.nama, aktif: r.aktif, jumlahSesi: r._count.sesi, jumlahPendamping: r._count.pengguna }));
}

async function cekDuplikatJenis(db: PrismaClient, d: { kode: string; nama: string }, kecualiId?: string): Promise<HasilMaster | null> {
  const ada = await db.jenisPendampingan.findFirst({
    where: {
      OR: [{ kode: d.kode }, { nama: { equals: d.nama, mode: "insensitive" } }],
      ...(kecualiId ? { NOT: { id: kecualiId } } : {}),
    },
  });
  if (!ada) return null;
  return ada.kode === d.kode
    ? { ok: false, pesan: "Kode sudah dipakai.", galat: { kode: `Kode "${d.kode}" sudah dipakai jenis lain.` } }
    : { ok: false, pesan: "Nama sudah ada.", galat: { nama: `"${d.nama}" sudah ada. Gunakan nama lain.` } };
}

export async function tambahJenisPendampingan(db: PrismaClient, mentah: unknown): Promise<HasilMaster> {
  const p = SkemaJenisPendampingan.safeParse(mentah);
  if (!p.success) return galatZod(p.error);
  const dup = await cekDuplikatJenis(db, p.data);
  if (dup) return dup;
  try {
    await db.jenisPendampingan.create({ data: p.data });
  } catch (e) {
    if (unik(e)) return { ok: false, pesan: "Kode atau nama sudah ada." };
    throw e;
  }
  return { ok: true };
}

export async function ubahJenisPendampingan(db: PrismaClient, id: string, mentah: unknown, aktif: boolean): Promise<HasilMaster> {
  const p = SkemaJenisPendampingan.safeParse(mentah);
  if (!p.success) return galatZod(p.error);
  const dup = await cekDuplikatJenis(db, p.data, id);
  if (dup) return dup;
  try {
    // Mengubah kode aman: nomor antrean lama tersimpan apa adanya di tiket.
    await db.jenisPendampingan.update({ where: { id }, data: { ...p.data, aktif } });
  } catch (e) {
    if (tidakAda(e)) return { ok: false, pesan: "Jenis pendampingan tidak ditemukan." };
    if (unik(e)) return { ok: false, pesan: "Kode atau nama sudah ada." };
    throw e;
  }
  return { ok: true };
}

export async function hapusJenisPendampingan(db: PrismaClient, id: string): Promise<HasilMaster> {
  const j = await db.jenisPendampingan.findUnique({ where: { id }, include: { _count: { select: { sesi: true, tiket: true, pengguna: true } } } });
  if (!j) return { ok: false, pesan: "Jenis pendampingan tidak ditemukan." };
  const dipakai = j._count.sesi + j._count.tiket + j._count.pengguna;
  if (dipakai > 0) {
    return { ok: false, pesan: `"${j.nama}" sudah dipakai (${j._count.sesi} sesi, ${j._count.pengguna} pendamping) sehingga tidak dapat dihapus. Nonaktifkan lewat Ubah.` };
  }
  await db.jenisPendampingan.delete({ where: { id } });
  return { ok: true };
}

// ------------------------------------------------------------------ Lokasi layanan

export const SkemaLokasi = z.object({
  nama: z
    .string({ error: "Nama lokasi wajib diisi." })
    .trim()
    .min(3, { error: "Nama lokasi wajib diisi (minimal 3 huruf)." })
    .max(120, { error: "Nama lokasi terlalu panjang (maksimal 120 huruf)." }),
  alamat: z
    .string({ error: "Alamat wajib diisi." })
    .trim()
    .min(5, { error: "Alamat wajib diisi (minimal 5 huruf)." })
    .max(300, { error: "Alamat terlalu panjang (maksimal 300 huruf)." }),
});

export async function daftarLokasi(db: PrismaClient) {
  const rows = await db.lokasi.findMany({ orderBy: { nama: "asc" }, include: { _count: { select: { sesi: true } } } });
  return rows.map((r) => ({ id: r.id, nama: r.nama, alamat: r.alamat, aktif: r.aktif, jumlahSesi: r._count.sesi }));
}

const duplikatLokasi = (nama: string): HasilMaster => ({ ok: false, pesan: "Nama sudah ada.", galat: { nama: `"${nama}" sudah ada. Gunakan nama lain.` } });

export async function tambahLokasi(db: PrismaClient, mentah: unknown): Promise<HasilMaster> {
  const p = SkemaLokasi.safeParse(mentah);
  if (!p.success) return galatZod(p.error);
  if (await db.lokasi.findFirst({ where: { nama: { equals: p.data.nama, mode: "insensitive" } } })) return duplikatLokasi(p.data.nama);
  try {
    await db.lokasi.create({ data: p.data });
  } catch (e) {
    if (unik(e)) return duplikatLokasi(p.data.nama);
    throw e;
  }
  return { ok: true };
}

export async function ubahLokasi(db: PrismaClient, id: string, mentah: unknown, aktif: boolean): Promise<HasilMaster> {
  const p = SkemaLokasi.safeParse(mentah);
  if (!p.success) return galatZod(p.error);
  if (await db.lokasi.findFirst({ where: { nama: { equals: p.data.nama, mode: "insensitive" }, NOT: { id } } })) return duplikatLokasi(p.data.nama);
  try {
    await db.lokasi.update({ where: { id }, data: { ...p.data, aktif } });
  } catch (e) {
    if (tidakAda(e)) return { ok: false, pesan: "Lokasi tidak ditemukan." };
    if (unik(e)) return duplikatLokasi(p.data.nama);
    throw e;
  }
  return { ok: true };
}

export async function hapusLokasi(db: PrismaClient, id: string): Promise<HasilMaster> {
  const l = await db.lokasi.findUnique({ where: { id }, include: { _count: { select: { sesi: true, tiket: true, petugas: true } } } });
  if (!l) return { ok: false, pesan: "Lokasi tidak ditemukan." };
  if (l._count.sesi + l._count.tiket + l._count.petugas > 0) {
    return { ok: false, pesan: `"${l.nama}" dipakai di ${l._count.sesi} sesi dan ${l._count.petugas} petugas sehingga tidak dapat dihapus. Nonaktifkan lewat Ubah.` };
  }
  await db.lokasi.delete({ where: { id } });
  return { ok: true };
}

// ------------------------------------------------------------------ Akun Pendamping

// Tanpa huruf/angka yang mudah tertukar (O/0, I/l/1) agar mudah disampaikan dan diketik.
const ALFABET_SANDI = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Kata sandi sementara 14 karakter, dibuat dengan pengacak kriptografis. */
export function buatKataSandiSementara(panjang = 14) {
  return Array.from({ length: panjang }, () => ALFABET_SANDI[randomInt(ALFABET_SANDI.length)]).join("");
}

export const SkemaPendamping = z.object({
  nama: z
    .string({ error: "Nama wajib diisi." })
    .trim()
    .min(3, { error: "Nama wajib diisi (minimal 3 huruf)." })
    .max(100, { error: "Nama terlalu panjang (maksimal 100 huruf)." }),
  email: z
    .string({ error: "Email wajib diisi." })
    .trim()
    .toLowerCase()
    .max(150, { error: "Email terlalu panjang." })
    .pipe(z.email({ error: "Format email tidak valid." })),
  jenisPendampingId: z.string({ error: "Pilih bidang pendampingan." }).trim().min(1, { error: "Pilih bidang pendampingan." }),
});

export async function daftarPendamping(db: PrismaClient) {
  const rows = await db.pengguna.findMany({
    where: { peran: "PENDAMPING" },
    orderBy: { nama: "asc" },
    include: {
      jenisPendamping: { select: { id: true, nama: true } },
      _count: { select: { sesi: { where: { status: "TERJADWAL" } } } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    email: r.email,
    aktif: r.aktif,
    jenisPendampingId: r.jenisPendampingId,
    bidang: r.jenisPendamping?.nama ?? null,
    sesiTerjadwal: r._count.sesi,
    dibuatPada: r.dibuatPada.toISOString(),
  }));
}

async function periksaBidang(db: PrismaClient, id: string) {
  return db.jenisPendampingan.findFirst({ where: { id, aktif: true }, select: { id: true } });
}

export async function tambahPendamping(db: PrismaClient, mentah: unknown): Promise<HasilMaster & { id?: string }> {
  const p = SkemaPendamping.safeParse(mentah);
  if (!p.success) return galatZod(p.error);
  if (!(await periksaBidang(db, p.data.jenisPendampingId))) {
    return { ok: false, pesan: "Bidang tidak ditemukan atau tidak aktif.", galat: { jenisPendampingId: "Bidang tidak ditemukan atau tidak aktif." } };
  }
  const kataSandi = buatKataSandiSementara();
  try {
    const u = await db.pengguna.create({
      data: { ...p.data, peran: "PENDAMPING", kataSandiHash: await hashPassword(kataSandi) },
    });
    return { ok: true, kataSandi, id: u.id };
  } catch (e) {
    if (unik(e)) return { ok: false, pesan: "Email sudah terdaftar.", galat: { email: "Email ini sudah terdaftar." } };
    throw e;
  }
}

export async function ubahPendamping(db: PrismaClient, id: string, mentah: unknown, aktif: boolean): Promise<HasilMaster> {
  const p = SkemaPendamping.safeParse(mentah);
  if (!p.success) return galatZod(p.error);
  const u = await db.pengguna.findFirst({ where: { id, peran: "PENDAMPING" } });
  if (!u) return { ok: false, pesan: "Pendamping tidak ditemukan." };
  // Bidang boleh tetap pada nilai lama walau jenisnya kini nonaktif.
  if (p.data.jenisPendampingId !== u.jenisPendampingId && !(await periksaBidang(db, p.data.jenisPendampingId))) {
    return { ok: false, pesan: "Bidang tidak ditemukan atau tidak aktif.", galat: { jenisPendampingId: "Bidang tidak ditemukan atau tidak aktif." } };
  }
  try {
    await db.pengguna.update({ where: { id }, data: { ...p.data, aktif } });
  } catch (e) {
    if (unik(e)) return { ok: false, pesan: "Email sudah terdaftar.", galat: { email: "Email ini sudah terdaftar." } };
    throw e;
  }
  return { ok: true };
}

export async function aturUlangKataSandi(db: PrismaClient, id: string, peran: "PENDAMPING" | "PETUGAS" = "PENDAMPING"): Promise<HasilMaster> {
  const u = await db.pengguna.findFirst({ where: { id, peran }, select: { id: true } });
  if (!u) return { ok: false, pesan: peran === "PETUGAS" ? "Petugas tidak ditemukan." : "Pendamping tidak ditemukan." };
  const kataSandi = buatKataSandiSementara();
  await db.pengguna.update({ where: { id }, data: { kataSandiHash: await hashPassword(kataSandi) } });
  return { ok: true, kataSandi };
}

// ------------------------------------------------------------------ Akun Petugas (loket)

export const SkemaPetugas = z.object({
  nama: SkemaPendamping.shape.nama,
  email: SkemaPendamping.shape.email,
  lokasiId: z.string({ error: "Pilih lokasi tugas." }).trim().min(1, { error: "Pilih lokasi tugas." }),
});

export async function daftarPetugas(db: PrismaClient) {
  const rows = await db.pengguna.findMany({
    where: { peran: "PETUGAS" },
    orderBy: { nama: "asc" },
    include: { lokasi: { select: { id: true, nama: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    email: r.email,
    aktif: r.aktif,
    lokasiId: r.lokasiId,
    lokasi: r.lokasi?.nama ?? null,
    dibuatPada: r.dibuatPada.toISOString(),
  }));
}

const periksaLokasiTugas = (db: PrismaClient, id: string) => db.lokasi.findFirst({ where: { id, aktif: true }, select: { id: true } });
const GALAT_LOKASI = { ok: false as const, pesan: "Lokasi tidak ditemukan atau tidak aktif.", galat: { lokasiId: "Lokasi tidak ditemukan atau tidak aktif." } };

export async function tambahPetugas(db: PrismaClient, mentah: unknown): Promise<HasilMaster & { id?: string }> {
  const p = SkemaPetugas.safeParse(mentah);
  if (!p.success) return galatZod(p.error);
  if (!(await periksaLokasiTugas(db, p.data.lokasiId))) return GALAT_LOKASI;
  const kataSandi = buatKataSandiSementara();
  try {
    const u = await db.pengguna.create({ data: { ...p.data, peran: "PETUGAS", kataSandiHash: await hashPassword(kataSandi) } });
    return { ok: true, kataSandi, id: u.id };
  } catch (e) {
    if (unik(e)) return { ok: false, pesan: "Email sudah terdaftar.", galat: { email: "Email ini sudah terdaftar." } };
    throw e;
  }
}

export async function ubahPetugas(db: PrismaClient, id: string, mentah: unknown, aktif: boolean): Promise<HasilMaster> {
  const p = SkemaPetugas.safeParse(mentah);
  if (!p.success) return galatZod(p.error);
  const u = await db.pengguna.findFirst({ where: { id, peran: "PETUGAS" } });
  if (!u) return { ok: false, pesan: "Petugas tidak ditemukan." };
  // Lokasi lama tetap boleh dipertahankan walau kini nonaktif.
  if (p.data.lokasiId !== u.lokasiId && !(await periksaLokasiTugas(db, p.data.lokasiId))) return GALAT_LOKASI;
  try {
    await db.pengguna.update({ where: { id }, data: { ...p.data, aktif } });
  } catch (e) {
    if (unik(e)) return { ok: false, pesan: "Email sudah terdaftar.", galat: { email: "Email ini sudah terdaftar." } };
    throw e;
  }
  return { ok: true };
}

// ------------------------------------------------------------------ Saklar aktif

export type JenisMaster = "jenisPendampingan" | "lokasi" | "pendamping" | "petugas";

/** Menyalakan atau mematikan satu data master (data tidak dihapus agar riwayat jadwal tetap utuh). */
export async function alihkanAktifMaster(db: PrismaClient, jenis: JenisMaster, id: string, aktif: boolean): Promise<HasilMaster> {
  try {
    if (jenis === "jenisPendampingan") await db.jenisPendampingan.update({ where: { id }, data: { aktif } });
    else if (jenis === "lokasi") await db.lokasi.update({ where: { id }, data: { aktif } });
    else {
      const peran = jenis === "petugas" ? "PETUGAS" : "PENDAMPING";
      const { count } = await db.pengguna.updateMany({ where: { id, peran }, data: { aktif } });
      if (count === 0) return { ok: false, pesan: peran === "PETUGAS" ? "Petugas tidak ditemukan." : "Pendamping tidak ditemukan." };
    }
  } catch (e) {
    if (tidakAda(e)) return { ok: false, pesan: "Data tidak ditemukan." };
    throw e;
  }
  return { ok: true };
}
