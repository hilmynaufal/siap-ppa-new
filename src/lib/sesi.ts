import * as z from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { KANAL_APLIKASI } from "./jadwal";
import { hitungUsia } from "./laporan-skema";
import { hariJakarta, terbitkanTiket, validasiJadwal, type GalatJadwal } from "./tiket";

export type StatusSesi = "TERJADWAL" | "BERLANGSUNG" | "SELESAI" | "TIDAK_HADIR" | "DIBATALKAN";
export type HasilSesi = { ok: true; pesan?: string } | { ok: false; pesan: string; galat?: GalatJadwal };

const AKTIF: StatusSesi[] = ["TERJADWAL", "BERLANGSUNG"];
const STATUS_TIKET = { BERLANGSUNG: "BERLANGSUNG", SELESAI: "SELESAI", TIDAK_HADIR: "DILEWATI", DIBATALKAN: "DILEWATI" } as const;

/** Perpindahan status yang diizinkan bagi Pendamping. */
export const TRANSISI_PENDAMPING: Partial<Record<StatusSesi, StatusSesi[]>> = {
  TERJADWAL: ["BERLANGSUNG", "TIDAK_HADIR"],
  BERLANGSUNG: ["SELESAI"],
};

const fmtTanggal = (d: Date) => d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
const fmtJam = (d: Date) => d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ":");

/** Inisial dari nama lengkap, mis. "Siti Aminah" menjadi "S.A.". Dipakai agar identitas korban tidak tampil bagi Pendamping. */
export function inisial(nama: string | null | undefined): string {
  const huruf = (nama ?? "").trim().split(/\s+/).filter(Boolean).map((k) => k[0].toUpperCase());
  return huruf.length ? huruf.slice(0, 3).join(".") + "." : "-";
}

function adaBentrokUnik(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

// ------------------------------------------------------------------ Pendamping: ubah status sesi

/**
 * Mengubah status sesi milik Pendamping. Perpindahan hanya sesuai alur (Terjadwal ke Berlangsung atau Tidak hadir,
 * Berlangsung ke Selesai) dan sesi baru dapat dimulai pada hari pelaksanaan. Status tiket antrean ikut diselaraskan,
 * dan kasus berstatus Terverifikasi menjadi Dalam pendampingan begitu sesi pertama dimulai.
 */
export async function ubahStatusSesi(
  db: PrismaClient,
  sesiId: string,
  pendampingId: string,
  target: StatusSesi,
  sekarang = new Date(),
): Promise<HasilSesi> {
  const sesi = await db.sesi.findFirst({
    where: { id: sesiId, pendampingId },
    select: { status: true, mulai: true, laporanId: true, laporan: { select: { status: true } } },
  });
  if (!sesi) return { ok: false, pesan: "Sesi tidak ditemukan." };
  if (sesi.laporan.status === "DITUTUP") return { ok: false, pesan: "Kasus ini sudah ditutup." };
  if (!TRANSISI_PENDAMPING[sesi.status as StatusSesi]?.includes(target)) {
    return { ok: false, pesan: `Sesi berstatus ${sesi.status.toLowerCase().replace("_", " ")} tidak dapat diubah menjadi ${target.toLowerCase().replace("_", " ")}.` };
  }
  if (sesi.status === "TERJADWAL" && hariJakarta(sesi.mulai) > hariJakarta(sekarang)) {
    return { ok: false, pesan: "Sesi baru dapat dimulai atau ditandai tidak hadir pada hari pelaksanaan." };
  }

  return db.$transaction(async (tx): Promise<HasilSesi> => {
    // Syarat status lama di dalam pembaruan mencegah dua perubahan bersamaan saling menimpa.
    const { count } = await tx.sesi.updateMany({ where: { id: sesiId, pendampingId, status: sesi.status }, data: { status: target } });
    if (count === 0) return { ok: false, pesan: "Status sesi sudah berubah. Muat ulang halaman." };
    const t = STATUS_TIKET[target as keyof typeof STATUS_TIKET];
    if (t) {
      await tx.tiket.updateMany({
        where: { sesiId },
        data: { statusAntrean: t, ...(target === "SELESAI" || target === "TIDAK_HADIR" ? { selesaiPada: sekarang } : {}) },
      });
    }
    if (target === "BERLANGSUNG") {
      await tx.laporan.updateMany({ where: { id: sesi.laporanId, status: "TERVERIFIKASI" }, data: { status: "DALAM_PENDAMPINGAN" } });
    }
    await tx.logAudit.create({
      data: { penggunaId: pendampingId, aksi: "UBAH_STATUS_SESI", entitas: "Sesi", entitasId: sesiId, rincian: { dari: sesi.status, ke: target } },
    });
    return { ok: true };
  });
}

// ------------------------------------------------------------------ Pendamping: daftar dan ringkasan (identitas korban dirahasiakan)

export type SesiPendamping = Awaited<ReturnType<typeof daftarSesiPendamping>>[number];

/** Sesi milik satu Pendamping beserta penanda tab. Tidak memuat nama, NIK, alamat, atau kontak korban dan pelapor. */
export async function daftarSesiPendamping(db: PrismaClient, pendampingId: string, sekarang = new Date()) {
  const rows = await db.sesi.findMany({
    where: { pendampingId },
    orderBy: { mulai: "asc" },
    include: {
      laporan: { select: { kodePendaftaran: true, korban: { select: { nama: true } }, jenisKekerasan: { select: { nama: true } } } },
      jenisPendamping: { select: { nama: true } },
      lokasi: { select: { nama: true, alamat: true } },
      tiket: { select: { nomorAntrean: true } },
      laporanPendampingan: { select: { dikirimPada: true } },
    },
  });
  const hariIni = hariJakarta(sekarang);
  return rows.map((s) => {
    const hari = hariJakarta(s.mulai);
    const aktif = (AKTIF as string[]).includes(s.status);
    const laporanTerkirim = s.laporanPendampingan?.dikirimPada != null;
    return {
      id: s.id,
      kodeLaporan: s.laporan.kodePendaftaran,
      inisialKorban: inisial(s.laporan.korban?.nama),
      jenisKekerasan: s.laporan.jenisKekerasan.nama,
      urutan: s.urutan,
      jenis: s.jenisPendamping.nama,
      lokasi: s.lokasi.nama,
      alamat: s.lokasi.alamat,
      nomorAntrean: s.tiket?.nomorAntrean ?? null,
      mulai: s.mulai.toISOString(),
      selesai: s.selesai.toISOString(),
      status: s.status as StatusSesi,
      // Sesi aktif yang jatuh hari ini, atau yang tertunda dari hari sebelumnya, ditangani hari ini.
      hariIni: aktif && hari <= hariIni,
      mendatang: aktif && hari > hariIni,
      perluLaporan: s.status === "SELESAI" && !laporanTerkirim,
      laporanTerkirim,
      bisaMulai: s.status === "TERJADWAL" && hari <= hariIni,
    };
  });
}

/** Ringkasan satu kasus untuk Pendamping yang ditugaskan: identitas dirahasiakan, hanya yang perlu untuk pendampingan. */
export async function ringkasanSesiPendamping(db: PrismaClient, sesiId: string, pendampingId: string, sekarang = new Date()) {
  const s = await db.sesi.findFirst({
    where: { id: sesiId, pendampingId },
    include: {
      jenisPendamping: { select: { nama: true } },
      lokasi: { select: { nama: true, alamat: true } },
      tiket: { select: { nomorAntrean: true } },
      laporan: {
        include: {
          jenisKekerasan: { select: { nama: true } },
          korban: { select: { nama: true, jenisKelamin: true, tanggalLahir: true, kecamatan: { select: { nama: true } } } },
          sesi: {
            orderBy: { urutan: "asc" },
            include: { jenisPendamping: { select: { nama: true } }, pendamping: { select: { nama: true } }, tiket: { select: { nomorAntrean: true } } },
          },
        },
      },
    },
  });
  if (!s) return null;
  const l = s.laporan;
  const lahir = l.korban?.tanggalLahir ? l.korban.tanggalLahir.toISOString().slice(0, 10) : null;
  return {
    id: s.id,
    laporanId: s.laporanId,
    jenisPendampingId: s.jenisPendampingId,
    urutan: s.urutan,
    status: s.status as StatusSesi,
    jenis: s.jenisPendamping.nama,
    lokasi: s.lokasi.nama,
    alamatLokasi: s.lokasi.alamat,
    nomorAntrean: s.tiket?.nomorAntrean ?? null,
    mulai: s.mulai.toISOString(),
    selesai: s.selesai.toISOString(),
    kasus: {
      kode: l.kodePendaftaran,
      status: l.status,
      inisialKorban: inisial(l.korban?.nama),
      jenisKelamin: l.korban?.jenisKelamin ?? null,
      usia: lahir ? hitungUsia(lahir, sekarang) : null,
      kecamatan: l.korban?.kecamatan?.nama ?? null,
      jenisKekerasan: l.jenisKekerasan.nama,
      tanggalKejadian: l.tanggalKejadian?.toISOString() ?? null,
      kronologi: l.kronologi,
    },
    // Linimasa sesi lain pada kasus yang sama; sesi pendamping lain hanya menampilkan status dan jenisnya.
    linimasa: l.sesi.map((x) => ({
      id: x.id,
      urutan: x.urutan,
      jenis: x.jenisPendamping.nama,
      pendamping: x.pendampingId === pendampingId ? "Anda" : x.pendamping.nama,
      nomorAntrean: x.tiket?.nomorAntrean ?? null,
      mulai: x.mulai.toISOString(),
      status: x.status as StatusSesi,
      saatIni: x.id === s.id,
    })),
  };
}

// ------------------------------------------------------------------ Admin: tambah, batalkan sesi, tutup kasus

const AlasanSkema = z
  .string({ error: "Alasan wajib diisi." })
  .trim()
  .min(5, { error: "Alasan wajib diisi (minimal 5 huruf)." })
  .max(300, { error: "Alasan terlalu panjang (maksimal 300 huruf)." });

async function beriTahu(tx: Prisma.TransactionClient, sesiId: string, pendampingId: string, pesanPelapor: string, pesanPendamping: string) {
  const sekarang = new Date();
  await tx.notifikasi.createMany({
    data: [
      { sesiId, penerima: "PELAPOR", kanal: KANAL_APLIKASI, dikirimPada: sekarang, pesan: pesanPelapor },
      { sesiId, penerima: "PENDAMPING", penerimaId: pendampingId, kanal: KANAL_APLIKASI, dikirimPada: sekarang, pesan: pesanPendamping },
    ],
  });
}

class UsulanTidakValid extends Error {}

/**
 * Menambah sesi pendampingan pada laporan yang sudah terverifikasi (satu laporan dapat memiliki banyak sesi).
 * Bila `usulanId` diberikan, usulan sesi lanjutan itu disetujui dan dihubungkan ke sesi baru dalam transaksi yang sama.
 */
export async function tambahSesi(db: PrismaClient, laporanId: string, adminId: string, jadwalMentah: unknown, sekarang = new Date(), usulanId?: string): Promise<HasilSesi> {
  const l = await db.laporan.findUnique({ where: { id: laporanId }, select: { status: true, kodePendaftaran: true } });
  if (!l) return { ok: false, pesan: "Laporan tidak ditemukan." };
  if (l.status !== "TERVERIFIKASI" && l.status !== "DALAM_PENDAMPINGAN") {
    return { ok: false, pesan: "Sesi hanya dapat ditambahkan pada kasus yang terverifikasi dan belum ditutup." };
  }
  const j = await validasiJadwal(db, jadwalMentah, sekarang);
  if (!j.ok) return { ok: false, pesan: "Lengkapi pendamping dan jadwal terlebih dahulu.", galat: j.galat };

  for (let percobaan = 1; ; percobaan++) {
    try {
      return await db.$transaction(async (tx): Promise<HasilSesi> => {
        // Pastikan kasus belum ditutup pada saat yang sama.
        const masihBuka = await tx.laporan.count({ where: { id: laporanId, status: { in: ["TERVERIFIKASI", "DALAM_PENDAMPINGAN"] } } });
        if (!masihBuka) return { ok: false, pesan: "Kasus sudah ditutup." };
        const t = await terbitkanTiket(tx, laporanId, j.jadwal);
        if (usulanId) {
          const { count } = await tx.usulanSesi.updateMany({
            where: { id: usulanId, status: "MENUNGGU", laporanPendampingan: { sesi: { laporanId } } },
            data: { status: "DISETUJUI", keputusanOlehId: adminId, diputuskanPada: new Date(), sesiHasilId: t.sesiId },
          });
          // Melempar agar tiket dan sesi yang baru terbit ikut dibatalkan.
          if (count === 0) throw new UsulanTidakValid();
        }
        const waktu = `${fmtTanggal(j.jadwal.mulai)}, pukul ${fmtJam(j.jadwal.mulai)}-${fmtJam(j.jadwal.selesai)} WIB`;
        await beriTahu(
          tx,
          t.sesiId,
          j.jadwal.data.pendampingId,
          `Sesi pendampingan baru dijadwalkan: ${waktu}. Nomor antrean: ${t.nomorAntrean}.`,
          `Sesi baru untuk laporan ${l.kodePendaftaran} dijadwalkan: ${waktu}.`,
        );
        await tx.logAudit.create({
          data: { penggunaId: adminId, aksi: usulanId ? "SETUJUI_USULAN_SESI" : "TAMBAH_SESI", entitas: "Sesi", entitasId: t.sesiId, rincian: { laporanId, nomorAntrean: t.nomorAntrean, ...(usulanId ? { usulanId } : {}) } },
        });
        return { ok: true, pesan: t.nomorAntrean };
      });
    } catch (e) {
      if (e instanceof UsulanTidakValid) return { ok: false, pesan: "Usulan ini sudah diputuskan." };
      if (!adaBentrokUnik(e) || percobaan >= 4) throw e;
    }
  }
}

/** Membatalkan sesi yang belum dimulai. Dicatat di riwayat jadwal dan audit, serta diberitahukan kepada Pelapor dan Pendamping. */
export async function batalkanSesi(db: PrismaClient, sesiId: string, adminId: string, alasanMentah: string): Promise<HasilSesi> {
  const a = AlasanSkema.safeParse(alasanMentah);
  if (!a.success) return { ok: false, pesan: a.error.issues[0].message };
  return db.$transaction(async (tx): Promise<HasilSesi> => {
    const s = await tx.sesi.findUnique({ where: { id: sesiId }, select: { pendampingId: true, mulai: true, laporan: { select: { kodePendaftaran: true } } } });
    if (!s) return { ok: false, pesan: "Sesi tidak ditemukan." };
    const { count } = await tx.sesi.updateMany({ where: { id: sesiId, status: "TERJADWAL" }, data: { status: "DIBATALKAN" } });
    if (count === 0) return { ok: false, pesan: "Hanya sesi berstatus Terjadwal yang dapat dibatalkan." };
    await tx.tiket.updateMany({ where: { sesiId }, data: { statusAntrean: "DILEWATI", selesaiPada: new Date() } });
    await tx.riwayatJadwal.create({ data: { sesiId, pengubahId: adminId, perubahan: { status: { dari: "TERJADWAL", ke: "DIBATALKAN" } }, alasan: a.data } });
    await beriTahu(
      tx,
      sesiId,
      s.pendampingId,
      `Sesi pendampingan pada ${fmtTanggal(s.mulai)} dibatalkan. Alasan: ${a.data}`,
      `Sesi laporan ${s.laporan.kodePendaftaran} pada ${fmtTanggal(s.mulai)} dibatalkan. Alasan: ${a.data}`,
    );
    await tx.logAudit.create({ data: { penggunaId: adminId, aksi: "BATALKAN_SESI", entitas: "Sesi", entitasId: sesiId, rincian: { alasan: a.data } } });
    return { ok: true };
  });
}

/** Apakah kasus dapat ditutup, beserta alasan bila belum. Dipakai tampilan dan pemeriksaan di server. */
export async function syaratTutupKasus(db: PrismaClient, laporanId: string) {
  const l = await db.laporan.findUnique({
    where: { id: laporanId },
    select: { status: true, sesi: { select: { status: true, laporanPendampingan: { select: { usulan: { select: { status: true } } } } } } },
  });
  if (!l) return { bisa: false, alasan: ["Laporan tidak ditemukan."], sudahDitutup: false };
  if (l.status === "DITUTUP") return { bisa: false, alasan: ["Kasus sudah ditutup."], sudahDitutup: true };
  const alasan: string[] = [];
  if (l.status !== "TERVERIFIKASI" && l.status !== "DALAM_PENDAMPINGAN") alasan.push("Kasus belum terverifikasi.");
  if (l.sesi.length === 0) alasan.push("Belum ada sesi pendampingan.");
  const aktif = l.sesi.filter((x) => (AKTIF as string[]).includes(x.status)).length;
  if (aktif > 0) alasan.push(`Masih ada ${aktif} sesi yang belum selesai.`);
  const usulan = l.sesi.filter((x) => x.laporanPendampingan?.usulan?.status === "MENUNGGU").length;
  if (usulan > 0) alasan.push(`Masih ada ${usulan} usulan sesi lanjutan yang menunggu keputusan.`);
  return { bisa: alasan.length === 0, alasan, sudahDitutup: false };
}

/** Menutup kasus setelah seluruh sesi selesai (tidak ada sesi aktif atau usulan sesi lanjutan yang menunggu). */
export async function tutupKasus(db: PrismaClient, laporanId: string, adminId: string): Promise<HasilSesi> {
  return db.$transaction(async (tx): Promise<HasilSesi> => {
    await tx.$queryRaw`SELECT id FROM laporan WHERE id = ${laporanId} FOR UPDATE`;
    const s = await syaratTutupKasus(tx as unknown as PrismaClient, laporanId);
    if (!s.bisa) return { ok: false, pesan: s.alasan[0] ?? "Kasus tidak dapat ditutup." };
    await tx.laporan.update({ where: { id: laporanId }, data: { status: "DITUTUP", ditutupPada: new Date() } });
    await tx.logAudit.create({ data: { penggunaId: adminId, aksi: "TUTUP_KASUS", entitas: "Laporan", entitasId: laporanId } });
    return { ok: true };
  });
}
