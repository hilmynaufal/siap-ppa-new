import type { PrismaClient } from "@/generated/prisma/client";
import { LAPORAN_AKTIF } from "./aktif";
import { DOKUMEN_LAPORAN, labelDokumen } from "./laporan";
import { OPSI_JENIS_KELAMIN, OPSI_PENDIDIKAN, OPSI_STATUS_BPJS, OPSI_STATUS_PERKAWINAN, hitungUsia } from "./laporan-skema";
import { dekripsiNik } from "./nik";
import { bacaPengaturanBap } from "./pengaturan";

/**
 * Data Berita Acara Pelaporan untuk dicetak. BAP memuat NIK utuh, sehingga setiap pembukaan dicatat
 * di log audit lebih dulu (seperti membuka NIK di halaman detail), tanpa menulis NIK-nya ke log.
 */

const ZONA = "Asia/Jakarta";
const label = (daftar: readonly { nilai: string; label: string }[], nilai: string | null | undefined) => (nilai ? (daftar.find((o) => o.nilai === nilai)?.label ?? nilai) : "");
const tglPanjang = (d: Date | null | undefined, zona = "UTC") => (d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: zona }) : "");
const buka = (cipher: string | null | undefined) => {
  if (!cipher) return "";
  try {
    return dekripsiNik(cipher);
  } catch {
    return "(tidak dapat dibuka)";
  }
};

/** Data diri seorang pihak dalam bentuk siap cetak (teks kosong bila tidak diisi). */
export type DiriBap = {
  nama: string;
  namaPanggilan: string;
  nik: string;
  jenisKelamin: string | null;
  ttl: string;
  usia: string;
  pekerjaan: string;
  pendidikan: string;
  agama: string;
  statusPerkawinan: string;
  alamatKtp: string;
  domisili: string;
  hp: string;
};

type Pilihan = { id: string; nama: string };

const urutanDokumen = (jenis: string | null) => {
  const i = DOKUMEN_LAPORAN.findIndex((d) => d.jenis === jenis);
  return i < 0 ? DOKUMEN_LAPORAN.length : i;
};

function diri(x: {
  nama?: string | null;
  namaPanggilan?: string | null;
  nikCipher?: string | null;
  jenisKelamin?: string | null;
  tempatLahir?: string | null;
  tanggalLahir?: Date | null;
  usia?: number | null;
  pekerjaan?: { nama: string } | null;
  pendidikan?: string | null;
  agama?: { nama: string } | null;
  statusPerkawinan?: string | null;
  alamatKtp?: string | null;
  alamat?: string | null;
  desa?: { nama: string } | null;
  kecamatan?: { nama: string } | null;
  kontak?: string | null;
}): DiriBap {
  const lahir = x.tanggalLahir ? x.tanggalLahir.toISOString().slice(0, 10) : null;
  const usia = lahir ? hitungUsia(lahir) : (x.usia ?? null);
  return {
    nama: x.nama ?? "",
    namaPanggilan: x.namaPanggilan ?? "",
    nik: buka(x.nikCipher),
    jenisKelamin: x.jenisKelamin ?? null,
    ttl: [x.tempatLahir, tglPanjang(x.tanggalLahir)].filter(Boolean).join(", "),
    usia: usia !== null && usia >= 0 ? `${usia} tahun` : "",
    pekerjaan: x.pekerjaan?.nama ?? "",
    pendidikan: label(OPSI_PENDIDIKAN, x.pendidikan),
    agama: x.agama?.nama ?? "",
    statusPerkawinan: label(OPSI_STATUS_PERKAWINAN, x.statusPerkawinan),
    alamatKtp: x.alamatKtp ?? "",
    domisili: [x.alamat, x.desa?.nama, x.kecamatan?.nama ? `Kec. ${x.kecamatan.nama}` : null].filter(Boolean).join(", "),
    hp: x.kontak ?? "",
  };
}

/** Daftar pilihan master untuk kotak centang: yang aktif ditambah yang terpilih (walau sudah nonaktif). */
async function pilihanMaster(cari: (where: object) => Promise<Pilihan[]>, terpilih: (string | null | undefined)[]) {
  const ids = terpilih.filter((x): x is string => !!x);
  return cari({ OR: [{ aktif: true }, { id: { in: ids } }] });
}

export async function muatBap(db: PrismaClient, laporanId: string, penggunaId: string) {
  const r = await db.laporan.findFirst({
    where: { id: laporanId, ...LAPORAN_AKTIF },
    include: {
      verifikator: { select: { nama: true } },
      jenisKekerasan: { select: { id: true, nama: true } },
      asalRujukan: { select: { nama: true } },
      pelapor: { include: { pekerjaan: { select: { nama: true } }, agama: { select: { nama: true } }, desa: { select: { nama: true } }, kecamatan: { select: { nama: true } } } },
      korban: { include: { pekerjaan: { select: { nama: true } }, agama: { select: { nama: true } }, desa: { select: { nama: true } }, kecamatan: { select: { nama: true } } } },
      terlapor: { orderBy: { id: "asc" }, take: 1, include: { pekerjaan: { select: { nama: true } }, agama: { select: { nama: true } } } },
      pendampinganDiminta: { select: { jenisPendamping: { select: { nama: true } } }, orderBy: { jenisPendamping: { nama: "asc" } } },
      dokumen: { select: { id: true, jenis: true, namaBerkas: true, tipeMime: true } },
    },
  });
  if (!r) return null;

  await db.logAudit.create({ data: { penggunaId, aksi: "CETAK_BAP", entitas: "Laporan", entitasId: laporanId } });

  const t = r.terlapor[0];
  const korban = r.korban ? diri(r.korban) : null;
  // Bila korban sendiri yang melapor, data pelapor sama dengan data korban.
  const pelapor = r.pelaporAdalahKorban ? korban : r.pelapor ? diri(r.pelapor) : null;

  const [hubungan, jenisKekerasan, pengaturan] = await Promise.all([
    pilihanMaster(
      (where) => db.hubunganKorban.findMany({ where, orderBy: [{ urutan: "asc" }, { nama: "asc" }], select: { id: true, nama: true } }),
      [r.pelapor?.hubunganId, t?.hubunganId],
    ),
    pilihanMaster((where) => db.jenisKekerasan.findMany({ where, orderBy: { nama: "asc" }, select: { id: true, nama: true } }), [r.jenisKekerasanId]),
    bacaPengaturanBap(db),
  ]);

  return {
    kode: r.kodePendaftaran,
    hariTanggal: r.dibuatPada.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA }),
    jam: `${r.dibuatPada.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }).replace(".", ":")} WIB`,
    penerima: r.verifikator?.nama ?? "",
    pelaporAdalahKorban: r.pelaporAdalahKorban,
    pelapor,
    relasiPelaporId: r.pelaporAdalahKorban ? null : (r.pelapor?.hubunganId ?? null),
    korban,
    noBpjs: r.korban?.noBpjs ?? "",
    statusBpjs: label(OPSI_STATUS_BPJS, r.korban?.statusBpjs),
    pelaku: t ? { ...diri(t), alamatKtp: t.alamat ?? "" } : null,
    hubunganPelakuId: t?.hubunganId ?? null,
    jenisKekerasanId: r.jenisKekerasanId,
    tkp: r.tempatKejadian ?? "",
    asalRujukan: r.asalRujukan?.nama ?? "",
    tanggalKejadian: tglPanjang(r.tanggalKejadian, ZONA),
    kronologi: r.kronologi,
    kebutuhan: r.pendampinganDiminta.map((p) => p.jenisPendamping.nama),
    alasanKebutuhan: r.alasanKebutuhan ?? "",
    lembagaRujukan: r.lembagaRujukan ?? "",
    pilihan: { hubungan, jenisKekerasan, jenisKelamin: OPSI_JENIS_KELAMIN },
    /** Dokumen pendukung untuk halaman lampiran, berurutan seperti di formulir (KK, KTP, akta, ...). */
    lampiran: [...r.dokumen]
      .sort((a, b) => urutanDokumen(a.jenis) - urutanDokumen(b.jenis) || a.namaBerkas.localeCompare(b.namaBerkas))
      .map((d) => ({ id: d.id, label: labelDokumen(d.jenis), namaBerkas: d.namaBerkas, pdf: d.tipeMime === "application/pdf" })),
    pengaturan,
  };
}

export type DataBap = NonNullable<Awaited<ReturnType<typeof muatBap>>>;
