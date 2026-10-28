import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { LAPORAN_AKTIF } from "./aktif";
import { DOKUMEN_LAPORAN, LABEL_ASAL_LANGSUNG, OPSI_JENIS_KELAMIN, OPSI_PENDIDIKAN, OPSI_STATUS_BPJS, OPSI_STATUS_PERKAWINAN, hitungUsia, labelDokumen } from "./laporan";
import { buatXlsx, type SelExcel } from "./xlsx";

export const STATUS_EKSPOR = ["BARU", "DITOLAK", "TERVERIFIKASI", "DALAM_PENDAMPINGAN", "DITUTUP"] as const;

const LABEL_STATUS: Record<(typeof STATUS_EKSPOR)[number], string> = {
  BARU: "Baru",
  DITOLAK: "Ditolak",
  TERVERIFIKASI: "Terverifikasi",
  DALAM_PENDAMPINGAN: "Dalam pendampingan",
  DITUTUP: "Ditutup",
};

export type FilterEkspor = {
  status?: string;
  jenis?: string;
  kecamatan?: string;
  /** Tanggal laporan masuk (YYYY-MM-DD, waktu Jakarta). */
  dari?: string;
  sampai?: string;
};

export const KOLOM_EKSPOR = [
  "No",
  "Kode pendaftaran",
  "Waktu lapor",
  "Status",
  "Jenis kekerasan",
  "Tanggal kejadian",
  "Tempat kejadian",
  "Dirujuk dari",
  "Lembaga yang merujuk",
  "Alasan dirujuk",
  "Pelapor adalah korban",
  "Nama pelapor",
  "Hubungan pelapor dengan korban",
  "Kontak pelapor",
  "Jenis kelamin pelapor",
  "Tempat lahir pelapor",
  "Tanggal lahir pelapor",
  "Pendidikan pelapor",
  "Pekerjaan pelapor",
  "Agama pelapor",
  "Status perkawinan pelapor",
  "Alamat pelapor",
  "Kecamatan pelapor",
  "Desa/kelurahan pelapor",
  "Nama korban",
  "Jenis kelamin korban",
  "Tempat lahir korban",
  "Tanggal lahir korban",
  "Usia korban",
  "Pendidikan korban",
  "Pekerjaan korban",
  "Agama korban",
  "Status perkawinan korban",
  "Status BPJS korban",
  "Kontak korban",
  "Alamat korban",
  "Kecamatan korban",
  "Desa/kelurahan korban",
  "Terlapor",
  "Kronologi",
  "Pendampingan diminta",
  "Dokumen terlampir",
  "Dokumen wajib belum ada",
  "Alasan penolakan",
  "Diverifikasi oleh",
  "Waktu verifikasi",
] as const;

const peta = (opsi: readonly { nilai: string; label: string }[]) => new Map(opsi.map((o) => [o.nilai, o.label]));
const JK = peta(OPSI_JENIS_KELAMIN);
const PDD = peta(OPSI_PENDIDIKAN);
const SPK = peta(OPSI_STATUS_PERKAWINAN);
const BPJS = peta(OPSI_STATUS_BPJS);

const hariJakarta = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
const waktuJakarta = (d: Date | null) => (d ? d.toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }) : "");
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/** Menyusun kondisi pencarian; nilai filter yang tidak dikenal diabaikan. */
export function kondisiEkspor(f: FilterEkspor): Prisma.LaporanWhereInput {
  const dibuat: Prisma.DateTimeFilter = {};
  if (f.dari && POLA_TANGGAL.test(f.dari)) dibuat.gte = new Date(`${f.dari}T00:00:00+07:00`);
  if (f.sampai && POLA_TANGGAL.test(f.sampai)) dibuat.lt = new Date(new Date(`${f.sampai}T00:00:00+07:00`).getTime() + 24 * 3600 * 1000);
  return {
    ...LAPORAN_AKTIF,
    status: STATUS_EKSPOR.find((s) => s === f.status),
    jenisKekerasan: f.jenis ? { nama: f.jenis } : undefined,
    korban: f.kecamatan ? { kecamatan: { nama: f.kecamatan } } : undefined,
    dibuatPada: Object.keys(dibuat).length ? dibuat : undefined,
  };
}

/**
 * Data laporan untuk Excel. NIK sengaja tidak disertakan: NIK utuh hanya dibuka satu per satu
 * lewat halaman detail dan tercatat di audit.
 */
export async function barisEkspor(db: PrismaClient, filter: FilterEkspor): Promise<SelExcel[][]> {
  const rows = await db.laporan.findMany({
    where: kondisiEkspor(filter),
    orderBy: { dibuatPada: "desc" },
    include: {
      jenisKekerasan: { select: { nama: true } },
      verifikator: { select: { nama: true } },
      asalRujukan: { select: { nama: true } },
      dokumen: { select: { jenis: true } },
      pelapor: {
        include: {
          hubungan: { select: { nama: true } },
          pekerjaan: { select: { nama: true } },
          agama: { select: { nama: true } },
          kecamatan: { select: { nama: true } },
          desa: { select: { nama: true } },
        },
      },
      korban: { include: { pekerjaan: { select: { nama: true } }, agama: { select: { nama: true } }, kecamatan: { select: { nama: true } }, desa: { select: { nama: true } } } },
      terlapor: { include: { hubungan: { select: { nama: true } } } },
      pendampinganDiminta: { select: { jenisPendamping: { select: { nama: true } } } },
    },
  });

  return rows.map((r, i) => {
    const p = r.pelapor;
    const k = r.korban;
    const lahir = k?.tanggalLahir ? k.tanggalLahir.toISOString().slice(0, 10) : null;
    const ada = new Set(r.dokumen.map((d) => d.jenis));
    const kurang = DOKUMEN_LAPORAN.filter((d) => d.wajib && !ada.has(d.jenis)).map((d) => d.label);
    const lampiran = DOKUMEN_LAPORAN.filter((d) => ada.has(d.jenis)).map((d) => labelDokumen(d.jenis));
    if (r.dokumen.some((d) => !d.jenis)) lampiran.push(labelDokumen(null));
    // Data lama (sebelum formulir membedakan jenis dokumen) tidak dihitung kurang.
    const lama = r.dokumen.length > 0 && r.dokumen.every((d) => !d.jenis);
    const terlapor = r.terlapor
      .map((t) => [t.nama ?? "Tidak diketahui", t.hubungan?.nama, t.usia ? `${t.usia} th` : null].filter(Boolean).join(", "))
      .join("; ");
    return [
      i + 1,
      r.kodePendaftaran,
      waktuJakarta(r.dibuatPada),
      LABEL_STATUS[r.status],
      r.jenisKekerasan.nama,
      r.tanggalKejadian ? hariJakarta(r.tanggalKejadian) : "",
      r.tempatKejadian,
      r.asalRujukan?.nama ?? (r.lembagaRujukan ? "" : LABEL_ASAL_LANGSUNG),
      r.lembagaRujukan,
      r.alasanRujukan,
      r.pelaporAdalahKorban ? "Ya" : "Tidak",
      p?.nama,
      p?.hubungan?.nama,
      p?.kontak,
      p?.jenisKelamin ? JK.get(p.jenisKelamin) : "",
      p?.tempatLahir,
      p?.tanggalLahir ? p.tanggalLahir.toISOString().slice(0, 10) : null,
      p?.pendidikan ? PDD.get(p.pendidikan) : "",
      p?.pekerjaan?.nama,
      p?.agama?.nama,
      p?.statusPerkawinan ? SPK.get(p.statusPerkawinan) : "",
      p?.alamat,
      p?.kecamatan?.nama,
      p?.desa?.nama,
      k?.nama,
      k?.jenisKelamin ? JK.get(k.jenisKelamin) : "",
      k?.tempatLahir,
      lahir,
      lahir ? hitungUsia(lahir) : null,
      k?.pendidikan ? PDD.get(k.pendidikan) : "",
      k?.pekerjaan?.nama,
      k?.agama?.nama,
      k?.statusPerkawinan ? SPK.get(k.statusPerkawinan) : "",
      k?.statusBpjs ? BPJS.get(k.statusBpjs) : "",
      k?.kontak,
      k?.alamat,
      k?.kecamatan?.nama,
      k?.desa?.nama,
      terlapor,
      r.kronologi,
      r.pendampinganDiminta.map((x) => x.jenisPendamping.nama).sort().join(", "),
      lampiran.join(", "),
      lama ? "" : kurang.join(", "),
      r.alasanPenolakan,
      r.verifikator?.nama,
      waktuJakarta(r.diverifikasiPada),
    ];
  });
}

export async function eksporLaporanXlsx(db: PrismaClient, filter: FilterEkspor) {
  const baris = await barisEkspor(db, filter);
  return { jumlah: baris.length, berkas: buatXlsx("Laporan", [...KOLOM_EKSPOR], baris) };
}
