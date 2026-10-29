import type { PrismaClient } from "@/generated/prisma/client";
import { LAPORAN_AKTIF } from "./aktif";
import { LABEL_ASAL_LANGSUNG, hitungUsia } from "./laporan-skema";

/**
 * Resume pendampingan per jenis pendampingan (format kertas UPTD "Resume Pendampingan Psikolog").
 * Baris tabel: sesi selesai yang laporannya sudah dikirim, dan sesi yang klien tidak hadir; berurutan menurut tanggal.
 * Tidak memuat NIK, tetapi memuat identitas korban, sehingga setiap pembukaan dicatat di log audit.
 */

const ZONA = "Asia/Jakarta";
const tglPanjang = (d: Date | null | undefined, zona = "UTC") => (d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: zona }) : "");

/** Judul resume dari nama jenis pendampingan: "Psikologis" -> "RESUME PENDAMPINGAN PSIKOLOGIS". */
export function judulResume(namaJenis: string) {
  const nama = namaJenis.trim().toUpperCase();
  return nama.startsWith("PENDAMPINGAN") ? `RESUME ${nama}` : `RESUME PENDAMPINGAN ${nama}`;
}

export type BarisResume = { no: number; tanggal: string; tidakHadir: boolean; keterangan: string; rekomendasi: string };

export async function muatResume(db: PrismaClient, laporanId: string, jenisId: string | undefined, penggunaId: string) {
  const r = await db.laporan.findFirst({
    where: { id: laporanId, ...LAPORAN_AKTIF },
    select: {
      kodePendaftaran: true,
      lembagaRujukan: true,
      jenisKekerasan: { select: { nama: true } },
      asalRujukan: { select: { nama: true } },
      korban: { select: { nama: true, tempatLahir: true, tanggalLahir: true, alamat: true, desa: { select: { nama: true } }, kecamatan: { select: { nama: true } } } },
      sesi: {
        where: { status: { not: "DIBATALKAN" } },
        orderBy: { mulai: "asc" },
        select: { jenisPendamping: { select: { id: true, nama: true } } },
      },
    },
  });
  if (!r) return null;

  // Pilihan jenis: jenis pendampingan yang pernah dijadwalkan untuk kasus ini, urut sesi pertama.
  const daftarJenis = [...new Map(r.sesi.map((s) => [s.jenisPendamping.id, s.jenisPendamping])).values()];
  const jenis = daftarJenis.find((j) => j.id === jenisId) ?? daftarJenis[0] ?? null;

  const sesi = jenis
    ? await db.sesi.findMany({
        where: {
          laporanId,
          jenisPendampingId: jenis.id,
          OR: [{ status: "TIDAK_HADIR" }, { status: "SELESAI", laporanPendampingan: { dikirimPada: { not: null } } }],
        },
        orderBy: { mulai: "asc" },
        select: { mulai: true, status: true, laporanPendampingan: { select: { keterangan: true, rekomendasi: true } } },
      })
    : [];

  await db.logAudit.create({ data: { penggunaId, aksi: "CETAK_RESUME_PENDAMPINGAN", entitas: "Laporan", entitasId: laporanId, rincian: { jenisPendampinganId: jenis?.id ?? null } } });

  const k = r.korban;
  const lahir = k?.tanggalLahir ? k.tanggalLahir.toISOString().slice(0, 10) : null;
  // Usia saat ini: resume dipakai selama pendampingan berlangsung.
  const usia = lahir ? hitungUsia(lahir) : null;
  const rujukan = r.asalRujukan
    ? [r.asalRujukan.nama, r.lembagaRujukan].filter(Boolean).join(" - ")
    : (r.lembagaRujukan ?? LABEL_ASAL_LANGSUNG);

  return {
    kode: r.kodePendaftaran,
    judul: jenis ? judulResume(jenis.nama) : "RESUME PENDAMPINGAN",
    jenis,
    daftarJenis,
    klien: {
      nama: k?.nama ?? "",
      usia: usia !== null && usia >= 0 ? `${usia} tahun` : "",
      ttl: [k?.tempatLahir, tglPanjang(k?.tanggalLahir)].filter(Boolean).join(", "),
      alamat: [k?.alamat, k?.desa?.nama, k?.kecamatan?.nama].filter(Boolean).join(", "),
    },
    jenisKekerasan: r.jenisKekerasan.nama,
    rujukan,
    baris: sesi.map(
      (s, i): BarisResume => ({
        no: i + 1,
        tanggal: tglPanjang(s.mulai, ZONA),
        tidakHadir: s.status === "TIDAK_HADIR",
        keterangan: s.laporanPendampingan?.keterangan ?? "",
        rekomendasi: s.laporanPendampingan?.rekomendasi ?? "",
      }),
    ),
  };
}

export type DataResume = NonNullable<Awaited<ReturnType<typeof muatResume>>>;
