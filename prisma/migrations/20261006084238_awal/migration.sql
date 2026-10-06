-- CreateEnum
CREATE TYPE "Peran" AS ENUM ('ADMIN', 'PENDAMPING');

-- CreateEnum
CREATE TYPE "StatusLaporan" AS ENUM ('BARU', 'DITOLAK', 'TERVERIFIKASI', 'DALAM_PENDAMPINGAN', 'DITUTUP');

-- CreateEnum
CREATE TYPE "StatusSesi" AS ENUM ('TERJADWAL', 'BERLANGSUNG', 'SELESAI', 'TIDAK_HADIR', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusAntrean" AS ENUM ('MENUNGGU', 'DIPANGGIL', 'BERLANGSUNG', 'SELESAI', 'DILEWATI');

-- CreateEnum
CREATE TYPE "StatusUsulan" AS ENUM ('MENUNGGU', 'DISETUJUI', 'DITOLAK');

-- CreateEnum
CREATE TYPE "PenerimaNotifikasi" AS ENUM ('PELAPOR', 'PENDAMPING');

-- CreateTable
CREATE TABLE "Pengguna" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "kataSandiHash" TEXT NOT NULL,
    "peran" "Peran" NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "jenisPendampingId" TEXT,
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubahPada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JenisKekerasan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "JenisKekerasan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JenisPendampingan" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "JenisPendampingan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kecamatan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Kecamatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lokasi" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Lokasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KontakDarurat" (
    "id" TEXT NOT NULL,
    "instansi" TEXT NOT NULL,
    "telepon" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "kecamatanId" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "KontakDarurat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Laporan" (
    "id" TEXT NOT NULL,
    "kodePendaftaran" TEXT NOT NULL,
    "namaPelapor" TEXT NOT NULL,
    "kontakPelapor" TEXT NOT NULL,
    "namaKorban" TEXT NOT NULL,
    "usiaKorban" INTEGER,
    "jenisKelaminKorban" TEXT,
    "jenisKekerasanId" TEXT NOT NULL,
    "kecamatanId" TEXT,
    "tanggalKejadian" TIMESTAMP(3),
    "kronologi" TEXT NOT NULL,
    "persetujuanData" BOOLEAN NOT NULL,
    "persetujuanPada" TIMESTAMP(3) NOT NULL,
    "status" "StatusLaporan" NOT NULL DEFAULT 'BARU',
    "alasanPenolakan" TEXT,
    "verifikatorId" TEXT,
    "diverifikasiPada" TIMESTAMP(3),
    "ditutupPada" TIMESTAMP(3),
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Laporan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DokumenLaporan" (
    "id" TEXT NOT NULL,
    "laporanId" TEXT NOT NULL,
    "namaBerkas" TEXT NOT NULL,
    "jalurBerkas" TEXT NOT NULL,
    "tipeMime" TEXT NOT NULL,
    "ukuran" INTEGER NOT NULL,

    CONSTRAINT "DokumenLaporan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesi" (
    "id" TEXT NOT NULL,
    "laporanId" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "jenisPendampingId" TEXT NOT NULL,
    "pendampingId" TEXT NOT NULL,
    "lokasiId" TEXT NOT NULL,
    "mulai" TIMESTAMP(3) NOT NULL,
    "selesai" TIMESTAMP(3) NOT NULL,
    "status" "StatusSesi" NOT NULL DEFAULT 'TERJADWAL',
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sesi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tiket" (
    "id" TEXT NOT NULL,
    "sesiId" TEXT NOT NULL,
    "nomorAntrean" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "urutan" INTEGER NOT NULL,
    "lokasiId" TEXT NOT NULL,
    "jenisPendampingId" TEXT NOT NULL,
    "kodeCheckIn" TEXT NOT NULL,
    "statusAntrean" "StatusAntrean" NOT NULL DEFAULT 'MENUNGGU',
    "checkInPada" TIMESTAMP(3),
    "dipanggilPada" TIMESTAMP(3),
    "selesaiPada" TIMESTAMP(3),
    "diterbitkanPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tiket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiwayatJadwal" (
    "id" TEXT NOT NULL,
    "sesiId" TEXT NOT NULL,
    "pengubahId" TEXT NOT NULL,
    "perubahan" JSONB NOT NULL,
    "alasan" TEXT,
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiwayatJadwal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifikasi" (
    "id" TEXT NOT NULL,
    "sesiId" TEXT NOT NULL,
    "penerima" "PenerimaNotifikasi" NOT NULL,
    "kanal" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "dikirimPada" TIMESTAMP(3),
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaporanPendampingan" (
    "id" TEXT NOT NULL,
    "sesiId" TEXT NOT NULL,
    "penulisId" TEXT NOT NULL,
    "jenisPendampingan" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "rekomendasi" TEXT NOT NULL,
    "ajukanSesiLanjutan" BOOLEAN NOT NULL DEFAULT false,
    "versi" INTEGER NOT NULL DEFAULT 1,
    "dikirimPada" TIMESTAMP(3),
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubahPada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaporanPendampingan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotoPendampingan" (
    "id" TEXT NOT NULL,
    "laporanPendampinganId" TEXT NOT NULL,
    "namaBerkas" TEXT NOT NULL,
    "jalurBerkas" TEXT NOT NULL,
    "tipeMime" TEXT NOT NULL,
    "ukuran" INTEGER NOT NULL,

    CONSTRAINT "FotoPendampingan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisiLaporanPendampingan" (
    "id" TEXT NOT NULL,
    "laporanPendampinganId" TEXT NOT NULL,
    "versi" INTEGER NOT NULL,
    "isiSebelumnya" JSONB NOT NULL,
    "alasan" TEXT NOT NULL,
    "pengubahId" TEXT NOT NULL,
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevisiLaporanPendampingan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsulanSesi" (
    "id" TEXT NOT NULL,
    "laporanPendampinganId" TEXT NOT NULL,
    "status" "StatusUsulan" NOT NULL DEFAULT 'MENUNGGU',
    "keputusanOlehId" TEXT,
    "diputuskanPada" TIMESTAMP(3),
    "sesiHasilId" TEXT,
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsulanSesi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAudit" (
    "id" TEXT NOT NULL,
    "penggunaId" TEXT,
    "aksi" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "entitasId" TEXT NOT NULL,
    "rincian" JSONB,
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pengguna_email_key" ON "Pengguna"("email");

-- CreateIndex
CREATE UNIQUE INDEX "JenisKekerasan_nama_key" ON "JenisKekerasan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "JenisPendampingan_kode_key" ON "JenisPendampingan"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "JenisPendampingan_nama_key" ON "JenisPendampingan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Kecamatan_nama_key" ON "Kecamatan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Lokasi_nama_key" ON "Lokasi"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Laporan_kodePendaftaran_key" ON "Laporan"("kodePendaftaran");

-- CreateIndex
CREATE INDEX "Laporan_status_dibuatPada_idx" ON "Laporan"("status", "dibuatPada");

-- CreateIndex
CREATE INDEX "Sesi_pendampingId_mulai_idx" ON "Sesi"("pendampingId", "mulai");

-- CreateIndex
CREATE UNIQUE INDEX "Sesi_laporanId_urutan_key" ON "Sesi"("laporanId", "urutan");

-- CreateIndex
CREATE UNIQUE INDEX "Tiket_sesiId_key" ON "Tiket"("sesiId");

-- CreateIndex
CREATE UNIQUE INDEX "Tiket_nomorAntrean_key" ON "Tiket"("nomorAntrean");

-- CreateIndex
CREATE UNIQUE INDEX "Tiket_kodeCheckIn_key" ON "Tiket"("kodeCheckIn");

-- CreateIndex
CREATE INDEX "Tiket_lokasiId_tanggal_statusAntrean_idx" ON "Tiket"("lokasiId", "tanggal", "statusAntrean");

-- CreateIndex
CREATE UNIQUE INDEX "Tiket_lokasiId_jenisPendampingId_tanggal_urutan_key" ON "Tiket"("lokasiId", "jenisPendampingId", "tanggal", "urutan");

-- CreateIndex
CREATE UNIQUE INDEX "LaporanPendampingan_sesiId_key" ON "LaporanPendampingan"("sesiId");

-- CreateIndex
CREATE UNIQUE INDEX "RevisiLaporanPendampingan_laporanPendampinganId_versi_key" ON "RevisiLaporanPendampingan"("laporanPendampinganId", "versi");

-- CreateIndex
CREATE UNIQUE INDEX "UsulanSesi_laporanPendampinganId_key" ON "UsulanSesi"("laporanPendampinganId");

-- CreateIndex
CREATE UNIQUE INDEX "UsulanSesi_sesiHasilId_key" ON "UsulanSesi"("sesiHasilId");

-- CreateIndex
CREATE INDEX "LogAudit_entitas_entitasId_idx" ON "LogAudit"("entitas", "entitasId");

-- AddForeignKey
ALTER TABLE "Pengguna" ADD CONSTRAINT "Pengguna_jenisPendampingId_fkey" FOREIGN KEY ("jenisPendampingId") REFERENCES "JenisPendampingan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KontakDarurat" ADD CONSTRAINT "KontakDarurat_kecamatanId_fkey" FOREIGN KEY ("kecamatanId") REFERENCES "Kecamatan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laporan" ADD CONSTRAINT "Laporan_jenisKekerasanId_fkey" FOREIGN KEY ("jenisKekerasanId") REFERENCES "JenisKekerasan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laporan" ADD CONSTRAINT "Laporan_kecamatanId_fkey" FOREIGN KEY ("kecamatanId") REFERENCES "Kecamatan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laporan" ADD CONSTRAINT "Laporan_verifikatorId_fkey" FOREIGN KEY ("verifikatorId") REFERENCES "Pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DokumenLaporan" ADD CONSTRAINT "DokumenLaporan_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "Laporan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesi" ADD CONSTRAINT "Sesi_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "Laporan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesi" ADD CONSTRAINT "Sesi_jenisPendampingId_fkey" FOREIGN KEY ("jenisPendampingId") REFERENCES "JenisPendampingan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesi" ADD CONSTRAINT "Sesi_pendampingId_fkey" FOREIGN KEY ("pendampingId") REFERENCES "Pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesi" ADD CONSTRAINT "Sesi_lokasiId_fkey" FOREIGN KEY ("lokasiId") REFERENCES "Lokasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tiket" ADD CONSTRAINT "Tiket_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "Sesi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tiket" ADD CONSTRAINT "Tiket_lokasiId_fkey" FOREIGN KEY ("lokasiId") REFERENCES "Lokasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tiket" ADD CONSTRAINT "Tiket_jenisPendampingId_fkey" FOREIGN KEY ("jenisPendampingId") REFERENCES "JenisPendampingan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatJadwal" ADD CONSTRAINT "RiwayatJadwal_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "Sesi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatJadwal" ADD CONSTRAINT "RiwayatJadwal_pengubahId_fkey" FOREIGN KEY ("pengubahId") REFERENCES "Pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifikasi" ADD CONSTRAINT "Notifikasi_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "Sesi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaporanPendampingan" ADD CONSTRAINT "LaporanPendampingan_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "Sesi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaporanPendampingan" ADD CONSTRAINT "LaporanPendampingan_penulisId_fkey" FOREIGN KEY ("penulisId") REFERENCES "Pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoPendampingan" ADD CONSTRAINT "FotoPendampingan_laporanPendampinganId_fkey" FOREIGN KEY ("laporanPendampinganId") REFERENCES "LaporanPendampingan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisiLaporanPendampingan" ADD CONSTRAINT "RevisiLaporanPendampingan_laporanPendampinganId_fkey" FOREIGN KEY ("laporanPendampinganId") REFERENCES "LaporanPendampingan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisiLaporanPendampingan" ADD CONSTRAINT "RevisiLaporanPendampingan_pengubahId_fkey" FOREIGN KEY ("pengubahId") REFERENCES "Pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsulanSesi" ADD CONSTRAINT "UsulanSesi_laporanPendampinganId_fkey" FOREIGN KEY ("laporanPendampinganId") REFERENCES "LaporanPendampingan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsulanSesi" ADD CONSTRAINT "UsulanSesi_keputusanOlehId_fkey" FOREIGN KEY ("keputusanOlehId") REFERENCES "Pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsulanSesi" ADD CONSTRAINT "UsulanSesi_sesiHasilId_fkey" FOREIGN KEY ("sesiHasilId") REFERENCES "Sesi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAudit" ADD CONSTRAINT "LogAudit_penggunaId_fkey" FOREIGN KEY ("penggunaId") REFERENCES "Pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;
