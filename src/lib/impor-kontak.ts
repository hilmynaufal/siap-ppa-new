import type { PrismaClient } from "@/generated/prisma/client";
import { SkemaKontak } from "./kontak-darurat";

export const MAKS_BARIS_IMPOR = 500;
export const MAKS_BYTE_IMPOR = 200 * 1024;
export const KOLOM_IMPOR = ["instansi", "telepon", "alamat", "kecamatan"] as const;

/** Templat CSV berisi baris contoh FIKTIF; Excel Indonesia memakai pemisah titik koma, keduanya diterima. */
export const TEMPLAT_CSV = [
  KOLOM_IMPOR.join(";"),
  "Contoh Satgas PPA Kecamatan Soreang;(022) 5800 0000;Kantor Kecamatan Soreang;Soreang",
  "Contoh UPTD PPA Kabupaten;(022) 5800 0001;Alamat kantor UPTD;",
].join("\r\n");

/** Pemisah kolom dideteksi dari baris pertama (titik koma atau koma); mendukung tanda kutip ganda dan baris di dalam kutip. */
export function uraiCsv(teks: string): string[][] {
  const isi = teks.replace(/^﻿/, "");
  const baris1 = isi.split(/\r?\n/, 1)[0] ?? "";
  const pemisah = (baris1.match(/;/g)?.length ?? 0) >= (baris1.match(/,/g)?.length ?? 0) && baris1.includes(";") ? ";" : ",";
  const hasil: string[][] = [];
  let baris: string[] = [];
  let sel = "";
  let dalamKutip = false;
  for (let i = 0; i < isi.length; i++) {
    const c = isi[i];
    if (dalamKutip) {
      if (c === '"' && isi[i + 1] === '"') {
        sel += '"';
        i++;
      } else if (c === '"') dalamKutip = false;
      else sel += c;
    } else if (c === '"') dalamKutip = true;
    else if (c === pemisah) {
      baris.push(sel);
      sel = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && isi[i + 1] === "\n") i++;
      baris.push(sel);
      sel = "";
      if (baris.some((x) => x.trim() !== "")) hasil.push(baris);
      baris = [];
    } else sel += c;
  }
  baris.push(sel);
  if (baris.some((x) => x.trim() !== "")) hasil.push(baris);
  return hasil;
}

export type BarisImpor = { instansi: string; telepon: string; alamat: string; kecamatanId: string | null; kecamatan: string | null };
export type GalatBaris = { baris: number; pesan: string };
export type PratinjauImpor = {
  ok: boolean;
  pesan?: string;
  valid: BarisImpor[];
  dilewati: { baris: number; instansi: string }[];
  galat: GalatBaris[];
};

/** Memeriksa seluruh isi berkas tanpa menulis apa pun. Baris yang sudah ada (instansi + kecamatan sama) dilewati. */
export async function periksaImporKontak(db: PrismaClient, teks: string): Promise<PratinjauImpor> {
  const kosong = (pesan: string): PratinjauImpor => ({ ok: false, pesan, valid: [], dilewati: [], galat: [] });
  const baris = uraiCsv(teks);
  if (baris.length === 0) return kosong("Berkas kosong.");
  const kepala = baris[0].map((k) => k.trim().toLowerCase());
  const idx = Object.fromEntries(KOLOM_IMPOR.map((k) => [k, kepala.indexOf(k)])) as Record<(typeof KOLOM_IMPOR)[number], number>;
  const hilang = KOLOM_IMPOR.filter((k) => idx[k] < 0);
  if (hilang.length > 0) return kosong(`Kolom tidak ditemukan: ${hilang.join(", ")}. Gunakan templat yang disediakan.`);
  const data = baris.slice(1);
  if (data.length === 0) return kosong("Berkas tidak berisi data (hanya judul kolom).");
  if (data.length > MAKS_BARIS_IMPOR) return kosong(`Terlalu banyak baris (maksimal ${MAKS_BARIS_IMPOR}).`);

  const [kecamatan, ada] = await Promise.all([
    db.kecamatan.findMany({ select: { id: true, nama: true } }),
    db.kontakDarurat.findMany({ select: { instansi: true, kecamatanId: true } }),
  ]);
  const petaKec = new Map(kecamatan.map((k) => [k.nama.toLowerCase(), k]));
  const kunci = (instansi: string, kecId: string | null) => `${instansi.trim().toLowerCase()}|${kecId ?? ""}`;
  const sudah = new Set(ada.map((a) => kunci(a.instansi, a.kecamatanId)));

  const hasil: PratinjauImpor = { ok: true, valid: [], dilewati: [], galat: [] };
  data.forEach((sel, i) => {
    const nomor = i + 2; // nomor baris di spreadsheet (baris 1 = judul)
    const ambil = (k: (typeof KOLOM_IMPOR)[number]) => (sel[idx[k]] ?? "").trim();
    const namaKec = ambil("kecamatan");
    const kec = namaKec ? petaKec.get(namaKec.toLowerCase()) : undefined;
    if (namaKec && !kec) {
      hasil.galat.push({ baris: nomor, pesan: `Kecamatan "${namaKec}" tidak dikenal.` });
      return;
    }
    const p = SkemaKontak.safeParse({ instansi: ambil("instansi"), telepon: ambil("telepon"), alamat: ambil("alamat"), kecamatanId: kec?.id ?? "" });
    if (!p.success) {
      hasil.galat.push({ baris: nomor, pesan: p.error.issues[0].message });
      return;
    }
    const k = kunci(p.data.instansi, p.data.kecamatanId);
    if (sudah.has(k)) {
      hasil.dilewati.push({ baris: nomor, instansi: p.data.instansi });
      return;
    }
    sudah.add(k); // baris kembar di dalam berkas yang sama juga dilewati
    hasil.valid.push({ ...p.data, kecamatan: kec?.nama ?? null });
  });
  hasil.ok = hasil.galat.length === 0;
  if (!hasil.ok) hasil.pesan = "Perbaiki baris yang ditandai lalu unggah ulang. Tidak ada data yang disimpan.";
  return hasil;
}

/** Menyimpan semua baris valid sekaligus (semua atau tidak sama sekali). Hanya berjalan bila seluruh berkas lolos pemeriksaan. */
export async function imporKontak(db: PrismaClient, teks: string, dibuatOlehId: string) {
  const p = await periksaImporKontak(db, teks);
  if (!p.ok) return { ok: false as const, pratinjau: p };
  await db.$transaction(
    p.valid.map((b) =>
      db.kontakDarurat.create({ data: { instansi: b.instansi, telepon: b.telepon, alamat: b.alamat, kecamatanId: b.kecamatanId, dibuatOlehId } }),
    ),
  );
  return { ok: true as const, ditambah: p.valid.length, dilewati: p.dilewati.length, pratinjau: p };
}
