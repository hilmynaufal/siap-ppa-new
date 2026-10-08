import * as z from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { MAKS_BARIS_IMPOR, uraiCsv, type GalatBaris } from "./impor-kontak";
import type { HasilMaster } from "./master-layanan";

export const SkemaDesa = z.object({
  kecamatanId: z.string({ error: "Pilih kecamatan." }).trim().min(1, { error: "Pilih kecamatan." }),
  nama: z
    .string({ error: "Nama desa/kelurahan wajib diisi." })
    .trim()
    .min(2, { error: "Nama wajib diisi (minimal 2 huruf)." })
    .max(100, { error: "Nama terlalu panjang (maksimal 100 huruf)." }),
  kode: z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : v),
    z.string().regex(/^[0-9.]{4,20}$/, { error: "Kode hanya angka dan titik (mis. 32.04.01.2001)." }).nullable(),
  ),
});

const kode = (e: unknown) => (typeof e === "object" && e !== null ? (e as { code?: string }).code : undefined);

export async function daftarDesa(db: PrismaClient) {
  const rows = await db.desa.findMany({ orderBy: [{ kecamatan: { nama: "asc" } }, { nama: "asc" }], include: { kecamatan: { select: { nama: true } } } });
  return rows.map((r) => ({ id: r.id, nama: r.nama, kode: r.kode, kecamatanId: r.kecamatanId, kecamatan: r.kecamatan.nama, aktif: true }));
}

/** Desa untuk pilihan di formulir: dikelompokkan per kecamatan oleh pemanggil. */
export async function pilihanDesa(db: PrismaClient) {
  return db.desa.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true, kecamatanId: true } });
}

function galatZod(err: z.ZodError): HasilMaster {
  const galat: Record<string, string> = {};
  for (const i of err.issues) if (!galat[String(i.path[0])]) galat[String(i.path[0])] = i.message;
  return { ok: false, pesan: "Lengkapi isian yang ditandai.", galat };
}

const duplikatNama = (nama: string): HasilMaster => ({ ok: false, pesan: "Sudah ada.", galat: { nama: `"${nama}" sudah ada di kecamatan ini.` } });
const duplikatKode = (): HasilMaster => ({ ok: false, pesan: "Kode sudah dipakai.", galat: { kode: "Kode ini sudah dipakai desa lain." } });

export async function tambahDesa(db: PrismaClient, mentah: unknown): Promise<HasilMaster> {
  const p = SkemaDesa.safeParse(mentah);
  if (!p.success) return galatZod(p.error);
  try {
    await db.desa.create({ data: p.data });
  } catch (e) {
    if (kode(e) === "P2002") return (await db.desa.findFirst({ where: { kode: p.data.kode ?? undefined } })) && p.data.kode ? duplikatKode() : duplikatNama(p.data.nama);
    if (kode(e) === "P2003") return { ok: false, pesan: "Kecamatan tidak ditemukan.", galat: { kecamatanId: "Kecamatan tidak ditemukan." } };
    throw e;
  }
  return { ok: true };
}

export async function ubahDesa(db: PrismaClient, id: string, mentah: unknown): Promise<HasilMaster> {
  const p = SkemaDesa.safeParse(mentah);
  if (!p.success) return galatZod(p.error);
  try {
    await db.desa.update({ where: { id }, data: p.data });
  } catch (e) {
    if (kode(e) === "P2025") return { ok: false, pesan: "Desa tidak ditemukan." };
    if (kode(e) === "P2002") return p.data.kode && (await db.desa.findFirst({ where: { kode: p.data.kode, NOT: { id } } })) ? duplikatKode() : duplikatNama(p.data.nama);
    throw e;
  }
  return { ok: true };
}

export async function hapusDesa(db: PrismaClient, id: string): Promise<HasilMaster> {
  try {
    await db.desa.delete({ where: { id } });
  } catch (e) {
    if (kode(e) === "P2025") return { ok: false, pesan: "Desa tidak ditemukan." };
    if (kode(e) === "P2003") return { ok: false, pesan: "Sudah dipakai di laporan sehingga tidak dapat dihapus." };
    throw e;
  }
  return { ok: true };
}

// ------------------------------------------------------------------ Impor CSV

export const KOLOM_IMPOR_DESA = ["kecamatan", "desa", "kode"] as const;
/** Templat dengan baris contoh FIKTIF; kolom kode boleh dikosongkan. */
export const TEMPLAT_DESA_CSV = [KOLOM_IMPOR_DESA.join(";"), "Soreang;Contoh Desa Satu;", "Soreang;Contoh Kelurahan Dua;32.04.01.1001"].join("\r\n");

export type BarisDesa = { kecamatanId: string; kecamatan: string; nama: string; kode: string | null };
export type PratinjauDesa = { ok: boolean; pesan?: string; valid: BarisDesa[]; dilewati: { baris: number; instansi: string }[]; galat: GalatBaris[] };

/** Memeriksa seluruh berkas tanpa menulis. Desa yang sudah ada (kecamatan + nama sama) dilewati; kode kembar jadi galat. */
export async function periksaImporDesa(db: PrismaClient, teks: string): Promise<PratinjauDesa> {
  const kosong = (pesan: string): PratinjauDesa => ({ ok: false, pesan, valid: [], dilewati: [], galat: [] });
  const baris = uraiCsv(teks);
  if (baris.length === 0) return kosong("Berkas kosong.");
  const kepala = baris[0].map((k) => k.trim().toLowerCase());
  const idx = Object.fromEntries(KOLOM_IMPOR_DESA.map((k) => [k, kepala.indexOf(k)])) as Record<(typeof KOLOM_IMPOR_DESA)[number], number>;
  const hilang = KOLOM_IMPOR_DESA.filter((k) => k !== "kode" && idx[k] < 0);
  if (hilang.length > 0) return kosong(`Kolom tidak ditemukan: ${hilang.join(", ")}. Gunakan templat yang disediakan.`);
  const data = baris.slice(1);
  if (data.length === 0) return kosong("Berkas tidak berisi data (hanya judul kolom).");
  if (data.length > MAKS_BARIS_IMPOR * 4) return kosong(`Terlalu banyak baris (maksimal ${MAKS_BARIS_IMPOR * 4}).`);

  const [kecamatan, ada] = await Promise.all([
    db.kecamatan.findMany({ select: { id: true, nama: true } }),
    db.desa.findMany({ select: { kecamatanId: true, nama: true, kode: true } }),
  ]);
  const petaKec = new Map(kecamatan.map((k) => [k.nama.toLowerCase(), k]));
  const kunci = (kecId: string, nama: string) => `${kecId}|${nama.trim().toLowerCase()}`;
  const sudah = new Set(ada.map((a) => kunci(a.kecamatanId, a.nama)));
  const kodePakai = new Set(ada.map((a) => a.kode).filter((x): x is string => !!x));

  const hasil: PratinjauDesa = { ok: true, valid: [], dilewati: [], galat: [] };
  data.forEach((sel, i) => {
    const nomor = i + 2;
    const ambil = (k: (typeof KOLOM_IMPOR_DESA)[number]) => (idx[k] >= 0 ? (sel[idx[k]] ?? "").trim() : "");
    const namaKec = ambil("kecamatan");
    const kec = petaKec.get(namaKec.toLowerCase());
    if (!kec) {
      hasil.galat.push({ baris: nomor, pesan: namaKec ? `Kecamatan "${namaKec}" tidak dikenal.` : "Kecamatan kosong." });
      return;
    }
    const p = SkemaDesa.safeParse({ kecamatanId: kec.id, nama: ambil("desa"), kode: ambil("kode") });
    if (!p.success) {
      hasil.galat.push({ baris: nomor, pesan: p.error.issues[0].message });
      return;
    }
    const k = kunci(kec.id, p.data.nama);
    if (sudah.has(k)) {
      hasil.dilewati.push({ baris: nomor, instansi: p.data.nama });
      return;
    }
    if (p.data.kode && kodePakai.has(p.data.kode)) {
      hasil.galat.push({ baris: nomor, pesan: `Kode ${p.data.kode} sudah dipakai.` });
      return;
    }
    sudah.add(k);
    if (p.data.kode) kodePakai.add(p.data.kode);
    hasil.valid.push({ kecamatanId: kec.id, kecamatan: kec.nama, nama: p.data.nama, kode: p.data.kode });
  });
  hasil.ok = hasil.galat.length === 0;
  if (!hasil.ok) hasil.pesan = "Perbaiki baris yang ditandai lalu unggah ulang. Tidak ada data yang disimpan.";
  return hasil;
}

/** Menyimpan semua baris valid sekaligus; hanya berjalan bila seluruh berkas lolos pemeriksaan. */
export async function imporDesa(db: PrismaClient, teks: string) {
  const p = await periksaImporDesa(db, teks);
  if (!p.ok) return { ok: false as const, pratinjau: p };
  await db.desa.createMany({ data: p.valid.map((b) => ({ kecamatanId: b.kecamatanId, nama: b.nama, kode: b.kode })) });
  return { ok: true as const, ditambah: p.valid.length, dilewati: p.dilewati.length, pratinjau: p };
}
