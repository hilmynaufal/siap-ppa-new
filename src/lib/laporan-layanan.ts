import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Pendidikan, PrismaClient, StatusPerkawinan } from "@/generated/prisma/client";
import { enkripsiNik, indeksNik } from "./nik";
import {
  MAKS_BERKAS,
  MAKS_UKURAN,
  buatKodePendaftaran,
  deteksiTipe,
  ekstensiUntuk,
  periksaBerkas,
  type DataLaporan,
  type Galat,
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
      const { pelapor, korban, terlapor } = data;
      const l = await db.laporan.create({
        data: {
          kodePendaftaran: kode,
          pelaporAdalahKorban: data.pelaporAdalahKorban,
          jenisKekerasanId: data.jenisKekerasanId,
          tanggalKejadian: new Date(`${data.tanggalKejadian}T00:00:00`),
          kronologi: data.kronologi,
          persetujuanData: true,
          persetujuanPada: new Date(),
          // NIK tidak pernah disimpan sebagai teks biasa: terenkripsi, ditambah indeks HMAC untuk pencarian.
          pelapor: pelapor
            ? {
                create: {
                  nama: pelapor.nama,
                  nikCipher: enkripsiNik(pelapor.nik),
                  nikIndeks: indeksNik(pelapor.nik),
                  hubunganId: pelapor.hubunganId,
                  kontak: pelapor.kontak,
                  alamat: pelapor.alamat,
                  kecamatanId: pelapor.kecamatanId,
                  desaId: pelapor.desaId,
                },
              }
            : undefined,
          korban: {
            create: {
              nama: korban.nama,
              nikCipher: enkripsiNik(korban.nik),
              nikIndeks: indeksNik(korban.nik),
              jenisKelamin: korban.jenisKelamin,
              tempatLahir: korban.tempatLahir,
              tanggalLahir: new Date(`${korban.tanggalLahir}T00:00:00Z`),
              pendidikan: korban.pendidikan as Pendidikan | null,
              pekerjaanId: korban.pekerjaanId,
              statusPerkawinan: korban.statusPerkawinan as StatusPerkawinan | null,
              kontak: korban.kontak,
              alamat: korban.alamat,
              kecamatanId: korban.kecamatanId,
              desaId: korban.desaId,
            },
          },
          terlapor: terlapor ? { create: terlapor } : undefined,
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

/**
 * Memastikan semua pilihan (jenis kekerasan, kecamatan, desa, hubungan, pekerjaan) benar-benar ada dan masih aktif,
 * desa memang berada di kecamatannya, dan desa diwajibkan bila kecamatan itu sudah punya data desa.
 * Mengembalikan galat per bidang formulir (objek kosong bila semuanya benar).
 */
export async function periksaPilihanLaporan(db: PrismaClient, d: DataLaporan): Promise<Galat> {
  const galat: Galat = {};
  const kec = [d.korban.kecamatanId, d.pelapor?.kecamatanId].filter((x): x is string => !!x);
  const desaId = [d.korban.desaId, d.pelapor?.desaId].filter((x): x is string => !!x);
  const hubunganId = [d.pelapor?.hubunganId, d.terlapor?.hubunganId].filter((x): x is string => !!x);

  const [jenis, kecamatan, desa, hubungan, pekerjaan, jumlahDesa] = await Promise.all([
    db.jenisKekerasan.findFirst({ where: { id: d.jenisKekerasanId, aktif: true }, select: { id: true } }),
    db.kecamatan.findMany({ where: { id: { in: kec } }, select: { id: true } }),
    db.desa.findMany({ where: { id: { in: desaId } }, select: { id: true, kecamatanId: true } }),
    db.hubunganKorban.findMany({ where: { id: { in: hubunganId }, aktif: true }, select: { id: true } }),
    d.korban.pekerjaanId ? db.pekerjaan.findFirst({ where: { id: d.korban.pekerjaanId, aktif: true }, select: { id: true } }) : Promise.resolve(true),
    db.desa.groupBy({ by: ["kecamatanId"], where: { kecamatanId: { in: kec } }, _count: true }),
  ]);
  const ada = (daftar: { id: string }[], id: string | null | undefined) => !id || daftar.some((x) => x.id === id);
  const punyaDesa = new Set(jumlahDesa.map((j) => j.kecamatanId));

  if (!jenis) galat.jenisKekerasanId = "Pilih jenis kekerasan dari daftar.";
  if (!ada(kecamatan, d.korban.kecamatanId)) galat.korbanKecamatanId = "Pilih kecamatan dari daftar.";
  if (!pekerjaan) galat.korbanPekerjaanId = "Pilih pekerjaan dari daftar.";
  if (d.pelapor && !ada(hubungan, d.pelapor.hubunganId)) galat.pelaporHubunganId = "Pilih hubungan dari daftar.";
  if (d.terlapor?.hubunganId && !ada(hubungan, d.terlapor.hubunganId)) galat.terlaporHubunganId = "Pilih hubungan dari daftar.";
  if (d.pelapor?.kecamatanId && !ada(kecamatan, d.pelapor.kecamatanId)) galat.pelaporKecamatanId = "Pilih kecamatan dari daftar.";

  const periksaDesa = (kecId: string | null | undefined, dId: string | null | undefined, kunci: "korbanDesaId" | "pelaporDesaId", wajib: boolean) => {
    if (!kecId) return;
    if (dId) {
      const baris = desa.find((x) => x.id === dId);
      if (!baris || baris.kecamatanId !== kecId) galat[kunci] = "Desa/kelurahan tidak sesuai dengan kecamatan.";
    } else if (wajib && punyaDesa.has(kecId)) {
      galat[kunci] = "Pilih desa/kelurahan.";
    }
  };
  periksaDesa(d.korban.kecamatanId, d.korban.desaId, "korbanDesaId", true);
  periksaDesa(d.pelapor?.kecamatanId, d.pelapor?.desaId, "pelaporDesaId", false);
  return galat;
}
