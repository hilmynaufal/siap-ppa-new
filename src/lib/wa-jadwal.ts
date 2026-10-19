import type { PrismaClient } from "@/generated/prisma/client";
import { SESI_AKTIF } from "./aktif";
import { KANAL_WHATSAPP } from "./kanal";
import { nomorPonsel, tautanWhatsapp } from "./whatsapp";

/**
 * Pemberitahuan jadwal lewat WhatsApp secara semi-otomatis: aplikasi menyusun pesan dan tautan wa.me,
 * Admin yang menekan kirim di WhatsApp. Pembukaan tautan dicatat sebagai notifikasi kanal WHATSAPP.
 */

export { KANAL_WHATSAPP };
const ZONA = "Asia/Jakarta";

/** Tautan Cek Tiket. Kode diletakkan di fragmen (#) agar tidak terkirim ke server atau tercatat di log. */
export function tautanCekTiket(asal: string, kode: string) {
  return `${asal.replace(/\/+$/, "")}/cek-tiket#kode=${encodeURIComponent(kode)}`;
}

export type DataPesanJadwal = {
  nama: string;
  kode: string;
  jenis: string;
  mulai: Date;
  selesai: Date;
  lokasi: string;
  alamat: string;
  nomorAntrean: string | null;
  tautan: string;
};

export function pesanJadwalWa(d: DataPesanJadwal): string {
  const tanggal = d.mulai.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA });
  const jam = (x: Date) => x.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }).replace(".", ":");
  return [
    `Halo ${d.nama || "Bapak/Ibu"},`,
    "",
    `Laporan Anda dengan kode ${d.kode} telah diverifikasi oleh UPTD PPA Kabupaten Bandung. Berikut jadwal pendampingan Anda:`,
    "",
    `Layanan: ${d.jenis}`,
    `Hari/tanggal: ${tanggal}`,
    `Waktu: ${jam(d.mulai)} - ${jam(d.selesai)} WIB`,
    `Tempat: ${d.lokasi}, ${d.alamat}`,
    ...(d.nomorAntrean ? [`Nomor antrean: ${d.nomorAntrean}`] : []),
    "",
    "Lihat tiket dan kode QR untuk check-in di:",
    d.tautan,
    "",
    "Mohon datang 15 menit sebelum jadwal. Pesan ini bersifat rahasia; jangan diteruskan kepada orang lain.",
  ].join("\n");
}

export type InfoWa = {
  sesiId: string;
  kode: string;
  penerima: string;
  nomor: string | null;
  /** Null bila nomor kontak bukan nomor ponsel yang dapat dihubungi lewat WhatsApp. */
  tautanWa: string | null;
  pesan: string;
  ringkas: { jenis: string; waktu: string; lokasi: string; nomorAntrean: string | null };
};

/** Menyusun pesan WhatsApp untuk satu sesi. Nomor tujuan: pelapor, atau korban bila korban sendiri yang melapor. */
export async function infoWaSesi(db: PrismaClient, sesiId: string, asal: string): Promise<InfoWa | null> {
  const s = await db.sesi.findFirst({
    where: { id: sesiId, ...SESI_AKTIF },
    select: {
      id: true,
      mulai: true,
      selesai: true,
      jenisPendamping: { select: { nama: true } },
      lokasi: { select: { nama: true, alamat: true } },
      tiket: { select: { nomorAntrean: true } },
      laporan: {
        select: {
          kodePendaftaran: true,
          pelaporAdalahKorban: true,
          pelapor: { select: { nama: true, kontak: true } },
          korban: { select: { nama: true, kontak: true } },
        },
      },
    },
  });
  if (!s) return null;
  const l = s.laporan;
  // Pelapor yang menyimpan kode pendaftaran; bila nomornya bukan ponsel, coba nomor korban.
  const calon = [l.pelaporAdalahKorban ? l.korban : (l.pelapor ?? l.korban), l.korban].filter((x): x is { nama: string; kontak: string | null } => !!x);
  const tujuan = calon.find((c) => nomorPonsel(c.kontak)) ?? calon[0] ?? { nama: "", kontak: null };
  const pesan = pesanJadwalWa({
    nama: tujuan.nama,
    kode: l.kodePendaftaran,
    jenis: s.jenisPendamping.nama,
    mulai: s.mulai,
    selesai: s.selesai,
    lokasi: s.lokasi.nama,
    alamat: s.lokasi.alamat,
    nomorAntrean: s.tiket?.nomorAntrean ?? null,
    tautan: tautanCekTiket(asal, l.kodePendaftaran),
  });
  const waktu = `${s.mulai.toLocaleString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: ZONA }).replace(".", ":")} WIB`;
  return {
    sesiId: s.id,
    kode: l.kodePendaftaran,
    penerima: tujuan.nama,
    nomor: tujuan.kontak,
    tautanWa: nomorPonsel(tujuan.kontak) ? tautanWhatsapp(tujuan.kontak, pesan) : null,
    pesan,
    ringkas: { jenis: s.jenisPendamping.nama, waktu, lokasi: `${s.lokasi.nama}, ${s.lokasi.alamat}`, nomorAntrean: s.tiket?.nomorAntrean ?? null },
  };
}

/**
 * Mencatat bahwa Admin membuka WhatsApp untuk sesi ini. Pengiriman sebenarnya terjadi di WhatsApp,
 * sehingga yang tercatat adalah waktu pesan disiapkan dan dibuka, beserta isinya.
 */
export async function catatWaDibuka(db: PrismaClient, sesiId: string, adminId: string, pesan: string) {
  await db.$transaction([
    db.notifikasi.create({ data: { sesiId, penerima: "PELAPOR", kanal: KANAL_WHATSAPP, pesan, dikirimPada: new Date() } }),
    db.logAudit.create({ data: { penggunaId: adminId, aksi: "BUKA_WA_JADWAL", entitas: "Sesi", entitasId: sesiId } }),
  ]);
}
