import type { Pendidikan, PrismaClient, StatusPerkawinan } from "@/generated/prisma/client";
import {
  OPSI_JENIS_KELAMIN,
  OPSI_PENDIDIKAN,
  OPSI_STATUS_BPJS,
  OPSI_STATUS_PERKAWINAN,
  bersihkanNoBpjs,
  noBpjsValid,
  tanggalValid,
  tidakDiMasaDepan,
} from "./laporan-skema";
import { SESI_AKTIF, LAPORAN_AKTIF } from "./aktif";
import { enkripsiNik, indeksNik, nikTersamar } from "./nik";
import { bersihkanNik, nikValid } from "./nik-format";

/**
 * Data tambahan untuk Berita Acara Pelaporan (BAP) yang tidak ditanyakan formulir publik.
 * Dilengkapi Admin atau Pendamping yang menangani kasus; setiap penyimpanan dicatat di log audit
 * (nama bidang yang berubah saja, tanpa isinya).
 */

/** Admin selalu boleh; Pendamping hanya bila punya sesi (yang tidak dibatalkan) pada laporan ini. */
export async function bolehAksesKasus(db: PrismaClient, pengguna: { id: string; peran: string }, laporanId: string): Promise<boolean> {
  if (pengguna.peran === "ADMIN") return true;
  if (pengguna.peran !== "PENDAMPING") return false;
  return (await db.sesi.count({ where: { laporanId, pendampingId: pengguna.id, status: { not: "DIBATALKAN" }, ...SESI_AKTIF } })) > 0;
}

export const BIDANG_BAP = [
  "pelaporJenisKelamin",
  "pelaporTempatLahir",
  "pelaporTanggalLahir",
  "pelaporPekerjaanId",
  "pelaporPendidikan",
  "pelaporAgamaId",
  "pelaporStatusPerkawinan",
  "pelaporAlamatKtp",
  "korbanNamaPanggilan",
  "korbanAgamaId",
  "korbanNoBpjs",
  "korbanStatusBpjs",
  "korbanAlamatKtp",
  "terlaporNama",
  "terlaporNamaPanggilan",
  "terlaporNik",
  "terlaporJenisKelamin",
  "terlaporTempatLahir",
  "terlaporTanggalLahir",
  "terlaporUsia",
  "terlaporPekerjaanId",
  "terlaporPendidikan",
  "terlaporAgamaId",
  "terlaporHubunganId",
  "terlaporAlamat",
  "tempatKejadian",
  "asalRujukanId",
  "lembagaRujukan",
  "alasanRujukan",
] as const;
export type BidangBap = (typeof BIDANG_BAP)[number];
export type IsianBap = Record<BidangBap, string>;
export type GalatBap = Partial<Record<BidangBap, string>>;

const MAKS: Partial<Record<BidangBap, number>> = { alasanRujukan: 500, lembagaRujukan: 150, asalRujukanId: 60, tempatKejadian: 300, pelaporAlamatKtp: 300, korbanAlamatKtp: 300, terlaporAlamat: 300 };
const nilaiOpsi = (o: readonly { nilai: string }[]) => new Set<string>(o.map((x) => x.nilai));
const OPSI: Partial<Record<BidangBap, Set<string>>> = {
  pelaporJenisKelamin: nilaiOpsi(OPSI_JENIS_KELAMIN),
  terlaporJenisKelamin: nilaiOpsi(OPSI_JENIS_KELAMIN),
  pelaporPendidikan: nilaiOpsi(OPSI_PENDIDIKAN),
  terlaporPendidikan: nilaiOpsi(OPSI_PENDIDIKAN),
  pelaporStatusPerkawinan: nilaiOpsi(OPSI_STATUS_PERKAWINAN),
  korbanStatusBpjs: nilaiOpsi(OPSI_STATUS_BPJS),
};

export function isianDariFormData(fd: FormData): IsianBap {
  return Object.fromEntries(BIDANG_BAP.map((k) => [k, String(fd.get(k) ?? "").trim()])) as IsianBap;
}

/** Pemeriksaan bentuk isian (semua tidak wajib). Keberadaan pilihan master diperiksa di `simpanDataBap`. */
export function periksaIsianBap(v: IsianBap): GalatBap {
  const g: GalatBap = {};
  for (const k of BIDANG_BAP) {
    const maks = MAKS[k] ?? 120;
    if (v[k].length > maks) g[k] = `Terlalu panjang (maksimal ${maks} huruf).`;
    else if (v[k] && OPSI[k] && !OPSI[k].has(v[k])) g[k] = "Pilihan tidak dikenal.";
  }
  for (const k of ["pelaporTanggalLahir", "terlaporTanggalLahir"] as const) {
    if (!v[k]) continue;
    if (!tanggalValid(v[k])) g[k] = "Tanggal tidak valid.";
    else if (!tidakDiMasaDepan(v[k])) g[k] = "Tanggal tidak boleh di masa depan.";
  }
  if (v.terlaporNik && !nikValid(bersihkanNik(v.terlaporNik))) g.terlaporNik = "NIK harus 16 digit angka dan berformat benar.";
  if (v.korbanNoBpjs && !noBpjsValid(v.korbanNoBpjs)) g.korbanNoBpjs = "Nomor BPJS harus 13 digit angka.";
  if (v.terlaporUsia && (!/^\d{1,3}$/.test(v.terlaporUsia) || Number(v.terlaporUsia) > 120)) g.terlaporUsia = "Usia harus angka 0-120.";
  return g;
}

const tgl = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
const atau = (v: string) => (v === "" ? null : v);
const keTanggal = (v: string) => (v ? new Date(`${v}T00:00:00Z`) : null);

/** Isian awal formulir dari data yang tersimpan. NIK pelaku tidak pernah dikirim ke browser; hanya versi tersamar. */
export async function isianBapAwal(db: PrismaClient, laporanId: string) {
  const l = await db.laporan.findFirst({
    where: { id: laporanId, ...LAPORAN_AKTIF },
    select: {
      id: true,
      kodePendaftaran: true,
      pelaporAdalahKorban: true,
      tempatKejadian: true,
      asalRujukanId: true,
      alasanRujukan: true,
      lembagaRujukan: true,
      pelapor: true,
      korban: true,
      terlapor: { orderBy: { id: "asc" }, take: 1 },
    },
  });
  if (!l) return null;
  const p = l.pelapor;
  const k = l.korban;
  const t = l.terlapor[0];
  const isian: IsianBap = {
    pelaporJenisKelamin: p?.jenisKelamin ?? "",
    pelaporTempatLahir: p?.tempatLahir ?? "",
    pelaporTanggalLahir: tgl(p?.tanggalLahir),
    pelaporPekerjaanId: p?.pekerjaanId ?? "",
    pelaporPendidikan: p?.pendidikan ?? "",
    pelaporAgamaId: p?.agamaId ?? "",
    pelaporStatusPerkawinan: p?.statusPerkawinan ?? "",
    pelaporAlamatKtp: p?.alamatKtp ?? "",
    korbanNamaPanggilan: k?.namaPanggilan ?? "",
    korbanAgamaId: k?.agamaId ?? "",
    korbanNoBpjs: k?.noBpjs ?? "",
    korbanStatusBpjs: k?.statusBpjs ?? "",
    korbanAlamatKtp: k?.alamatKtp ?? "",
    terlaporNama: t?.nama ?? "",
    terlaporNamaPanggilan: t?.namaPanggilan ?? "",
    terlaporNik: "",
    terlaporJenisKelamin: t?.jenisKelamin ?? "",
    terlaporTempatLahir: t?.tempatLahir ?? "",
    terlaporTanggalLahir: tgl(t?.tanggalLahir),
    terlaporUsia: t?.usia != null ? String(t.usia) : "",
    terlaporPekerjaanId: t?.pekerjaanId ?? "",
    terlaporPendidikan: t?.pendidikan ?? "",
    terlaporAgamaId: t?.agamaId ?? "",
    terlaporHubunganId: t?.hubunganId ?? "",
    terlaporAlamat: t?.alamat ?? "",
    tempatKejadian: l.tempatKejadian ?? "",
    asalRujukanId: l.asalRujukanId ?? "",
    alasanRujukan: l.alasanRujukan ?? "",
    lembagaRujukan: l.lembagaRujukan ?? "",
  };
  return {
    laporanId: l.id,
    kode: l.kodePendaftaran,
    adaPelapor: !!p,
    adaKorban: !!k,
    /** Alamat domisili yang diisi Pelapor, untuk tombol "sama dengan domisili". */
    domisili: {
      pelapor: p?.alamat ?? "",
      korban: k?.alamat ?? "",
    },
    nikTerlapor: t?.nikCipher ? nikTersamar(t.nikCipher) : null,
    isian,
  };
}

export type HasilSimpanBap = { ok: true; berubah: string[] } | { ok: false; pesan: string; galat?: GalatBap };

/** Menyimpan data BAP. Bidang kosong mengosongkan nilainya, kecuali NIK pelaku: kosong berarti tidak diubah. */
export async function simpanDataBap(db: PrismaClient, laporanId: string, v: IsianBap, penggunaId: string): Promise<HasilSimpanBap> {
  const galat = periksaIsianBap(v);
  if (Object.keys(galat).length) return { ok: false, pesan: "Periksa isian yang ditandai.", galat };

  const awal = await isianBapAwal(db, laporanId);
  if (!awal) return { ok: false, pesan: "Laporan tidak ditemukan." };

  // Pilihan master harus ada (yang sudah nonaktif tetap boleh bila memang tersimpan sebelumnya).
  const ids = (daftar: string[]) => [...new Set(daftar.filter(Boolean))];
  const [pekerjaan, agama, hubungan, rujukan] = await Promise.all([
    db.pekerjaan.findMany({ where: { id: { in: ids([v.pelaporPekerjaanId, v.terlaporPekerjaanId]) } }, select: { id: true } }),
    db.agama.findMany({ where: { id: { in: ids([v.pelaporAgamaId, v.korbanAgamaId, v.terlaporAgamaId]) } }, select: { id: true } }),
    db.hubunganKorban.findMany({ where: { id: { in: ids([v.terlaporHubunganId]) } }, select: { id: true } }),
    db.asalRujukan.findMany({ where: { id: { in: ids([v.asalRujukanId]) } }, select: { id: true } }),
  ]);
  const ada = (daftar: { id: string }[], id: string) => !id || daftar.some((x) => x.id === id);
  for (const k of ["pelaporPekerjaanId", "terlaporPekerjaanId"] as const) if (!ada(pekerjaan, v[k])) galat[k] = "Pilih pekerjaan dari daftar.";
  for (const k of ["pelaporAgamaId", "korbanAgamaId", "terlaporAgamaId"] as const) if (!ada(agama, v[k])) galat[k] = "Pilih agama dari daftar.";
  if (!ada(hubungan, v.terlaporHubunganId)) galat.terlaporHubunganId = "Pilih hubungan dari daftar.";
  if (!ada(rujukan, v.asalRujukanId)) galat.asalRujukanId = "Pilih asal rujukan dari daftar.";
  if (Object.keys(galat).length) return { ok: false, pesan: "Ada pilihan yang tidak sesuai.", galat };

  const berubah = BIDANG_BAP.filter((k) => {
    if (k === "terlaporNik") return v.terlaporNik !== "";
    if (k.startsWith("pelapor") && !awal.adaPelapor) return false;
    if (k === "korbanNoBpjs") return (v.korbanNoBpjs ? bersihkanNoBpjs(v.korbanNoBpjs) : "") !== awal.isian.korbanNoBpjs;
    return v[k] !== awal.isian[k];
  });
  if (berubah.length === 0) return { ok: true, berubah };

  const nikPelaku = v.terlaporNik ? bersihkanNik(v.terlaporNik) : null;
  const dataTerlapor = {
    nama: atau(v.terlaporNama),
    namaPanggilan: atau(v.terlaporNamaPanggilan),
    jenisKelamin: atau(v.terlaporJenisKelamin) as "LAKI_LAKI" | "PEREMPUAN" | "LAINNYA" | null,
    tempatLahir: atau(v.terlaporTempatLahir),
    tanggalLahir: keTanggal(v.terlaporTanggalLahir),
    usia: v.terlaporUsia === "" ? null : Number(v.terlaporUsia),
    pekerjaanId: atau(v.terlaporPekerjaanId),
    pendidikan: atau(v.terlaporPendidikan) as Pendidikan | null,
    agamaId: atau(v.terlaporAgamaId),
    hubunganId: atau(v.terlaporHubunganId),
    alamat: atau(v.terlaporAlamat),
    ...(nikPelaku ? { nikCipher: enkripsiNik(nikPelaku), nikIndeks: indeksNik(nikPelaku) } : {}),
  };
  const adaIsianPelaku = BIDANG_BAP.some((k) => k.startsWith("terlapor") && v[k] !== "");

  await db.$transaction(async (tx) => {
    await tx.laporan.update({
      where: { id: laporanId },
      data: {
        tempatKejadian: atau(v.tempatKejadian),
        asalRujukanId: atau(v.asalRujukanId),
        alasanRujukan: atau(v.alasanRujukan),
        lembagaRujukan: atau(v.lembagaRujukan),
      },
    });
    if (awal.adaPelapor) {
      await tx.pelapor.update({
        where: { laporanId },
        data: {
          jenisKelamin: atau(v.pelaporJenisKelamin) as "LAKI_LAKI" | "PEREMPUAN" | "LAINNYA" | null,
          tempatLahir: atau(v.pelaporTempatLahir),
          tanggalLahir: keTanggal(v.pelaporTanggalLahir),
          pekerjaanId: atau(v.pelaporPekerjaanId),
          pendidikan: atau(v.pelaporPendidikan) as Pendidikan | null,
          agamaId: atau(v.pelaporAgamaId),
          statusPerkawinan: atau(v.pelaporStatusPerkawinan) as StatusPerkawinan | null,
          alamatKtp: atau(v.pelaporAlamatKtp),
        },
      });
    }
    if (awal.adaKorban) {
      await tx.korban.update({
        where: { laporanId },
        data: {
          namaPanggilan: atau(v.korbanNamaPanggilan),
          agamaId: atau(v.korbanAgamaId),
          noBpjs: v.korbanNoBpjs ? bersihkanNoBpjs(v.korbanNoBpjs) : null,
          statusBpjs: atau(v.korbanStatusBpjs) as "AKTIF" | "TIDAK_AKTIF" | "TIDAK_TAHU" | null,
          alamatKtp: atau(v.korbanAlamatKtp),
        },
      });
    }
    // Formulir mengurus pelaku pertama; baris baru dibuat bila belum ada dan ada isian.
    const pelaku = await tx.terlapor.findFirst({ where: { laporanId }, orderBy: { id: "asc" }, select: { id: true } });
    if (pelaku) await tx.terlapor.update({ where: { id: pelaku.id }, data: dataTerlapor });
    else if (adaIsianPelaku) await tx.terlapor.create({ data: { laporanId, ...dataTerlapor } });

    await tx.logAudit.create({ data: { penggunaId, aksi: "LENGKAPI_DATA_BAP", entitas: "Laporan", entitasId: laporanId, rincian: { bidang: berubah } } });
  });
  return { ok: true, berubah };
}
