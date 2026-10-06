import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  MAKS_BERKAS,
  MAKS_UKURAN,
  buatKodePendaftaran,
  deteksiTipe,
  ekstensiUntuk,
  periksaBerkas,
  type DataLaporan,
} from "./laporan";

export type BerkasMasuk = { nama: string; bytes: Uint8Array };

export type HasilKirim = { ok: true; kode: string } | { ok: false; pesan: string };

/** Direktori unggahan di luar akar web. Dapat diatur lewat UPLOAD_DIR (di Docker: /data/uploads). */
export function direktoriUnggah() {
  return path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "uploads");
}

function adalahPelanggaranUnik(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

/**
 * Menyimpan laporan beserta berkas pendukung. Berkas diperiksa ulang di sini (jumlah, ukuran, dan isi),
 * tidak mengandalkan pemeriksaan di klien. Bila penyimpanan berkas gagal, laporan dibatalkan.
 */
export async function simpanLaporan(
  db: PrismaClient,
  data: DataLaporan,
  berkas: BerkasMasuk[],
  dir = direktoriUnggah(),
): Promise<HasilKirim> {
  if (berkas.length > MAKS_BERKAS) return { ok: false, pesan: `Maksimal ${MAKS_BERKAS} berkas.` };
  const diperiksa: { nama: string; bytes: Uint8Array; tipe: NonNullable<ReturnType<typeof deteksiTipe>> }[] = [];
  for (const b of berkas) {
    const galat = periksaBerkas({ name: b.nama, size: b.bytes.length });
    if (galat) return { ok: false, pesan: `${b.nama}: ${galat}` };
    if (b.bytes.length > MAKS_UKURAN) return { ok: false, pesan: `${b.nama}: Ukuran lebih dari 5 MB.` };
    const tipe = deteksiTipe(b.bytes);
    if (!tipe) return { ok: false, pesan: `${b.nama}: Isi berkas bukan JPG, PNG, atau PDF.` };
    diperiksa.push({ ...b, tipe });
  }

  let laporanId = "";
  let kode = "";
  for (let percobaan = 0; percobaan < 5 && !laporanId; percobaan++) {
    kode = buatKodePendaftaran();
    try {
      const l = await db.laporan.create({
        data: {
          kodePendaftaran: kode,
          namaPelapor: data.namaPelapor,
          kontakPelapor: data.kontakPelapor,
          namaKorban: data.namaKorban,
          usiaKorban: data.usiaKorban ?? null,
          jenisKelaminKorban: data.jenisKelaminKorban ?? null,
          jenisKekerasanId: data.jenisKekerasanId,
          kecamatanId: data.kecamatanId,
          tanggalKejadian: new Date(`${data.tanggalKejadian}T00:00:00`),
          kronologi: data.kronologi,
          persetujuanData: true,
          persetujuanPada: new Date(),
        },
        select: { id: true },
      });
      laporanId = l.id;
    } catch (e) {
      if (!adalahPelanggaranUnik(e)) throw e;
    }
  }
  if (!laporanId) return { ok: false, pesan: "Gagal membuat kode pendaftaran. Silakan coba lagi." };

  const folder = path.join(dir, laporanId);
  try {
    if (diperiksa.length) await mkdir(folder, { recursive: true });
    for (const b of diperiksa) {
      const nama = `${randomUUID()}.${ekstensiUntuk(b.tipe)}`;
      await writeFile(path.join(/* turbopackIgnore: true */ folder, nama), b.bytes);
      await db.dokumenLaporan.create({
        data: {
          laporanId,
          namaBerkas: b.nama.slice(0, 200),
          jalurBerkas: path.join(/* turbopackIgnore: true */ laporanId, nama),
          tipeMime: b.tipe,
          ukuran: b.bytes.length,
        },
      });
    }
  } catch (e) {
    await db.laporan.delete({ where: { id: laporanId } }).catch(() => {});
    await rm(folder, { recursive: true, force: true }).catch(() => {});
    throw e;
  }
  return { ok: true, kode };
}
