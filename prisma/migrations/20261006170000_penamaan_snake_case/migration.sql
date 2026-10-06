-- Bagian 1: ganti nama tipe enum, tabel, dan kolom ke snake_case (data tidak berubah)
ALTER TYPE "Peran" RENAME TO peran;
ALTER TYPE "StatusLaporan" RENAME TO status_laporan;
ALTER TYPE "StatusSesi" RENAME TO status_sesi;
ALTER TYPE "StatusAntrean" RENAME TO status_antrean;
ALTER TYPE "StatusUsulan" RENAME TO status_usulan;
ALTER TYPE "PenerimaNotifikasi" RENAME TO penerima_notifikasi;
ALTER TABLE "Pengguna" RENAME TO pengguna;
ALTER TABLE "JenisKekerasan" RENAME TO jenis_kekerasan;
ALTER TABLE "JenisPendampingan" RENAME TO jenis_pendampingan;
ALTER TABLE "Kecamatan" RENAME TO kecamatan;
ALTER TABLE "Lokasi" RENAME TO lokasi;
ALTER TABLE "KontakDarurat" RENAME TO kontak_darurat;
ALTER TABLE "Laporan" RENAME TO laporan;
ALTER TABLE "DokumenLaporan" RENAME TO dokumen_laporan;
ALTER TABLE "Sesi" RENAME TO sesi;
ALTER TABLE "Tiket" RENAME TO tiket;
ALTER TABLE "RiwayatJadwal" RENAME TO riwayat_jadwal;
ALTER TABLE "Notifikasi" RENAME TO notifikasi;
ALTER TABLE "LaporanPendampingan" RENAME TO laporan_pendampingan;
ALTER TABLE "FotoPendampingan" RENAME TO foto_pendampingan;
ALTER TABLE "RevisiLaporanPendampingan" RENAME TO revisi_laporan_pendampingan;
ALTER TABLE "UsulanSesi" RENAME TO usulan_sesi;
ALTER TABLE "LogAudit" RENAME TO log_audit;
ALTER TABLE pengguna RENAME COLUMN "kataSandiHash" TO kata_sandi_hash;
ALTER TABLE pengguna RENAME COLUMN "jenisPendampingId" TO jenis_pendamping_id;
ALTER TABLE pengguna RENAME COLUMN "dibuatPada" TO dibuat_pada;
ALTER TABLE pengguna RENAME COLUMN "diubahPada" TO diubah_pada;
ALTER TABLE jenis_kekerasan RENAME COLUMN "dibuatPada" TO dibuat_pada;
ALTER TABLE jenis_kekerasan RENAME COLUMN "diubahPada" TO diubah_pada;
ALTER TABLE jenis_kekerasan RENAME COLUMN "dibuatOlehId" TO dibuat_oleh_id;
ALTER TABLE kontak_darurat RENAME COLUMN "kecamatanId" TO kecamatan_id;
ALTER TABLE laporan RENAME COLUMN "kodePendaftaran" TO kode_pendaftaran;
ALTER TABLE laporan RENAME COLUMN "namaPelapor" TO nama_pelapor;
ALTER TABLE laporan RENAME COLUMN "kontakPelapor" TO kontak_pelapor;
ALTER TABLE laporan RENAME COLUMN "namaKorban" TO nama_korban;
ALTER TABLE laporan RENAME COLUMN "usiaKorban" TO usia_korban;
ALTER TABLE laporan RENAME COLUMN "jenisKelaminKorban" TO jenis_kelamin_korban;
ALTER TABLE laporan RENAME COLUMN "jenisKekerasanId" TO jenis_kekerasan_id;
ALTER TABLE laporan RENAME COLUMN "kecamatanId" TO kecamatan_id;
ALTER TABLE laporan RENAME COLUMN "tanggalKejadian" TO tanggal_kejadian;
ALTER TABLE laporan RENAME COLUMN "persetujuanData" TO persetujuan_data;
ALTER TABLE laporan RENAME COLUMN "persetujuanPada" TO persetujuan_pada;
ALTER TABLE laporan RENAME COLUMN "alasanPenolakan" TO alasan_penolakan;
ALTER TABLE laporan RENAME COLUMN "verifikatorId" TO verifikator_id;
ALTER TABLE laporan RENAME COLUMN "diverifikasiPada" TO diverifikasi_pada;
ALTER TABLE laporan RENAME COLUMN "ditutupPada" TO ditutup_pada;
ALTER TABLE laporan RENAME COLUMN "dibuatPada" TO dibuat_pada;
ALTER TABLE dokumen_laporan RENAME COLUMN "laporanId" TO laporan_id;
ALTER TABLE dokumen_laporan RENAME COLUMN "namaBerkas" TO nama_berkas;
ALTER TABLE dokumen_laporan RENAME COLUMN "jalurBerkas" TO jalur_berkas;
ALTER TABLE dokumen_laporan RENAME COLUMN "tipeMime" TO tipe_mime;
ALTER TABLE sesi RENAME COLUMN "laporanId" TO laporan_id;
ALTER TABLE sesi RENAME COLUMN "jenisPendampingId" TO jenis_pendamping_id;
ALTER TABLE sesi RENAME COLUMN "pendampingId" TO pendamping_id;
ALTER TABLE sesi RENAME COLUMN "lokasiId" TO lokasi_id;
ALTER TABLE sesi RENAME COLUMN "dibuatPada" TO dibuat_pada;
ALTER TABLE tiket RENAME COLUMN "sesiId" TO sesi_id;
ALTER TABLE tiket RENAME COLUMN "nomorAntrean" TO nomor_antrean;
ALTER TABLE tiket RENAME COLUMN "lokasiId" TO lokasi_id;
ALTER TABLE tiket RENAME COLUMN "jenisPendampingId" TO jenis_pendamping_id;
ALTER TABLE tiket RENAME COLUMN "kodeCheckIn" TO kode_check_in;
ALTER TABLE tiket RENAME COLUMN "statusAntrean" TO status_antrean;
ALTER TABLE tiket RENAME COLUMN "checkInPada" TO check_in_pada;
ALTER TABLE tiket RENAME COLUMN "dipanggilPada" TO dipanggil_pada;
ALTER TABLE tiket RENAME COLUMN "selesaiPada" TO selesai_pada;
ALTER TABLE tiket RENAME COLUMN "diterbitkanPada" TO diterbitkan_pada;
ALTER TABLE riwayat_jadwal RENAME COLUMN "sesiId" TO sesi_id;
ALTER TABLE riwayat_jadwal RENAME COLUMN "pengubahId" TO pengubah_id;
ALTER TABLE riwayat_jadwal RENAME COLUMN "dibuatPada" TO dibuat_pada;
ALTER TABLE notifikasi RENAME COLUMN "sesiId" TO sesi_id;
ALTER TABLE notifikasi RENAME COLUMN "dikirimPada" TO dikirim_pada;
ALTER TABLE notifikasi RENAME COLUMN "dibuatPada" TO dibuat_pada;
ALTER TABLE laporan_pendampingan RENAME COLUMN "sesiId" TO sesi_id;
ALTER TABLE laporan_pendampingan RENAME COLUMN "penulisId" TO penulis_id;
ALTER TABLE laporan_pendampingan RENAME COLUMN "jenisPendampingan" TO jenis_pendampingan;
ALTER TABLE laporan_pendampingan RENAME COLUMN "ajukanSesiLanjutan" TO ajukan_sesi_lanjutan;
ALTER TABLE laporan_pendampingan RENAME COLUMN "dikirimPada" TO dikirim_pada;
ALTER TABLE laporan_pendampingan RENAME COLUMN "dibuatPada" TO dibuat_pada;
ALTER TABLE laporan_pendampingan RENAME COLUMN "diubahPada" TO diubah_pada;
ALTER TABLE foto_pendampingan RENAME COLUMN "laporanPendampinganId" TO laporan_pendampingan_id;
ALTER TABLE foto_pendampingan RENAME COLUMN "namaBerkas" TO nama_berkas;
ALTER TABLE foto_pendampingan RENAME COLUMN "jalurBerkas" TO jalur_berkas;
ALTER TABLE foto_pendampingan RENAME COLUMN "tipeMime" TO tipe_mime;
ALTER TABLE revisi_laporan_pendampingan RENAME COLUMN "laporanPendampinganId" TO laporan_pendampingan_id;
ALTER TABLE revisi_laporan_pendampingan RENAME COLUMN "isiSebelumnya" TO isi_sebelumnya;
ALTER TABLE revisi_laporan_pendampingan RENAME COLUMN "pengubahId" TO pengubah_id;
ALTER TABLE revisi_laporan_pendampingan RENAME COLUMN "dibuatPada" TO dibuat_pada;
ALTER TABLE usulan_sesi RENAME COLUMN "laporanPendampinganId" TO laporan_pendampingan_id;
ALTER TABLE usulan_sesi RENAME COLUMN "keputusanOlehId" TO keputusan_oleh_id;
ALTER TABLE usulan_sesi RENAME COLUMN "diputuskanPada" TO diputuskan_pada;
ALTER TABLE usulan_sesi RENAME COLUMN "sesiHasilId" TO sesi_hasil_id;
ALTER TABLE usulan_sesi RENAME COLUMN "dibuatPada" TO dibuat_pada;
ALTER TABLE log_audit RENAME COLUMN "penggunaId" TO pengguna_id;
ALTER TABLE log_audit RENAME COLUMN "entitasId" TO entitas_id;
ALTER TABLE log_audit RENAME COLUMN "dibuatPada" TO dibuat_pada;

-- Bagian 2: samakan nama indeks dan constraint dengan nama baru (dihasilkan prisma migrate diff)
-- AlterTable
ALTER TABLE "dokumen_laporan" RENAME CONSTRAINT "DokumenLaporan_pkey" TO "dokumen_laporan_pkey";

-- AlterTable
ALTER TABLE "foto_pendampingan" RENAME CONSTRAINT "FotoPendampingan_pkey" TO "foto_pendampingan_pkey";

-- AlterTable
ALTER TABLE "jenis_kekerasan" RENAME CONSTRAINT "JenisKekerasan_pkey" TO "jenis_kekerasan_pkey";

-- AlterTable
ALTER TABLE "jenis_pendampingan" RENAME CONSTRAINT "JenisPendampingan_pkey" TO "jenis_pendampingan_pkey";

-- AlterTable
ALTER TABLE "kecamatan" RENAME CONSTRAINT "Kecamatan_pkey" TO "kecamatan_pkey";

-- AlterTable
ALTER TABLE "kontak_darurat" RENAME CONSTRAINT "KontakDarurat_pkey" TO "kontak_darurat_pkey";

-- AlterTable
ALTER TABLE "laporan" RENAME CONSTRAINT "Laporan_pkey" TO "laporan_pkey";

-- AlterTable
ALTER TABLE "laporan_pendampingan" RENAME CONSTRAINT "LaporanPendampingan_pkey" TO "laporan_pendampingan_pkey";

-- AlterTable
ALTER TABLE "log_audit" RENAME CONSTRAINT "LogAudit_pkey" TO "log_audit_pkey";

-- AlterTable
ALTER TABLE "lokasi" RENAME CONSTRAINT "Lokasi_pkey" TO "lokasi_pkey";

-- AlterTable
ALTER TABLE "notifikasi" RENAME CONSTRAINT "Notifikasi_pkey" TO "notifikasi_pkey";

-- AlterTable
ALTER TABLE "pengguna" RENAME CONSTRAINT "Pengguna_pkey" TO "pengguna_pkey";

-- AlterTable
ALTER TABLE "revisi_laporan_pendampingan" RENAME CONSTRAINT "RevisiLaporanPendampingan_pkey" TO "revisi_laporan_pendampingan_pkey";

-- AlterTable
ALTER TABLE "riwayat_jadwal" RENAME CONSTRAINT "RiwayatJadwal_pkey" TO "riwayat_jadwal_pkey";

-- AlterTable
ALTER TABLE "sesi" RENAME CONSTRAINT "Sesi_pkey" TO "sesi_pkey";

-- AlterTable
ALTER TABLE "tiket" RENAME CONSTRAINT "Tiket_pkey" TO "tiket_pkey";

-- AlterTable
ALTER TABLE "usulan_sesi" RENAME CONSTRAINT "UsulanSesi_pkey" TO "usulan_sesi_pkey";

-- RenameForeignKey
ALTER TABLE "dokumen_laporan" RENAME CONSTRAINT "DokumenLaporan_laporanId_fkey" TO "dokumen_laporan_laporan_id_fkey";

-- RenameForeignKey
ALTER TABLE "foto_pendampingan" RENAME CONSTRAINT "FotoPendampingan_laporanPendampinganId_fkey" TO "foto_pendampingan_laporan_pendampingan_id_fkey";

-- RenameForeignKey
ALTER TABLE "jenis_kekerasan" RENAME CONSTRAINT "JenisKekerasan_dibuatOlehId_fkey" TO "jenis_kekerasan_dibuat_oleh_id_fkey";

-- RenameForeignKey
ALTER TABLE "kontak_darurat" RENAME CONSTRAINT "KontakDarurat_kecamatanId_fkey" TO "kontak_darurat_kecamatan_id_fkey";

-- RenameForeignKey
ALTER TABLE "laporan" RENAME CONSTRAINT "Laporan_jenisKekerasanId_fkey" TO "laporan_jenis_kekerasan_id_fkey";

-- RenameForeignKey
ALTER TABLE "laporan" RENAME CONSTRAINT "Laporan_kecamatanId_fkey" TO "laporan_kecamatan_id_fkey";

-- RenameForeignKey
ALTER TABLE "laporan" RENAME CONSTRAINT "Laporan_verifikatorId_fkey" TO "laporan_verifikator_id_fkey";

-- RenameForeignKey
ALTER TABLE "laporan_pendampingan" RENAME CONSTRAINT "LaporanPendampingan_penulisId_fkey" TO "laporan_pendampingan_penulis_id_fkey";

-- RenameForeignKey
ALTER TABLE "laporan_pendampingan" RENAME CONSTRAINT "LaporanPendampingan_sesiId_fkey" TO "laporan_pendampingan_sesi_id_fkey";

-- RenameForeignKey
ALTER TABLE "log_audit" RENAME CONSTRAINT "LogAudit_penggunaId_fkey" TO "log_audit_pengguna_id_fkey";

-- RenameForeignKey
ALTER TABLE "notifikasi" RENAME CONSTRAINT "Notifikasi_sesiId_fkey" TO "notifikasi_sesi_id_fkey";

-- RenameForeignKey
ALTER TABLE "pengguna" RENAME CONSTRAINT "Pengguna_jenisPendampingId_fkey" TO "pengguna_jenis_pendamping_id_fkey";

-- RenameForeignKey
ALTER TABLE "revisi_laporan_pendampingan" RENAME CONSTRAINT "RevisiLaporanPendampingan_laporanPendampinganId_fkey" TO "revisi_laporan_pendampingan_laporan_pendampingan_id_fkey";

-- RenameForeignKey
ALTER TABLE "revisi_laporan_pendampingan" RENAME CONSTRAINT "RevisiLaporanPendampingan_pengubahId_fkey" TO "revisi_laporan_pendampingan_pengubah_id_fkey";

-- RenameForeignKey
ALTER TABLE "riwayat_jadwal" RENAME CONSTRAINT "RiwayatJadwal_pengubahId_fkey" TO "riwayat_jadwal_pengubah_id_fkey";

-- RenameForeignKey
ALTER TABLE "riwayat_jadwal" RENAME CONSTRAINT "RiwayatJadwal_sesiId_fkey" TO "riwayat_jadwal_sesi_id_fkey";

-- RenameForeignKey
ALTER TABLE "sesi" RENAME CONSTRAINT "Sesi_jenisPendampingId_fkey" TO "sesi_jenis_pendamping_id_fkey";

-- RenameForeignKey
ALTER TABLE "sesi" RENAME CONSTRAINT "Sesi_laporanId_fkey" TO "sesi_laporan_id_fkey";

-- RenameForeignKey
ALTER TABLE "sesi" RENAME CONSTRAINT "Sesi_lokasiId_fkey" TO "sesi_lokasi_id_fkey";

-- RenameForeignKey
ALTER TABLE "sesi" RENAME CONSTRAINT "Sesi_pendampingId_fkey" TO "sesi_pendamping_id_fkey";

-- RenameForeignKey
ALTER TABLE "tiket" RENAME CONSTRAINT "Tiket_jenisPendampingId_fkey" TO "tiket_jenis_pendamping_id_fkey";

-- RenameForeignKey
ALTER TABLE "tiket" RENAME CONSTRAINT "Tiket_lokasiId_fkey" TO "tiket_lokasi_id_fkey";

-- RenameForeignKey
ALTER TABLE "tiket" RENAME CONSTRAINT "Tiket_sesiId_fkey" TO "tiket_sesi_id_fkey";

-- RenameForeignKey
ALTER TABLE "usulan_sesi" RENAME CONSTRAINT "UsulanSesi_keputusanOlehId_fkey" TO "usulan_sesi_keputusan_oleh_id_fkey";

-- RenameForeignKey
ALTER TABLE "usulan_sesi" RENAME CONSTRAINT "UsulanSesi_laporanPendampinganId_fkey" TO "usulan_sesi_laporan_pendampingan_id_fkey";

-- RenameForeignKey
ALTER TABLE "usulan_sesi" RENAME CONSTRAINT "UsulanSesi_sesiHasilId_fkey" TO "usulan_sesi_sesi_hasil_id_fkey";

-- RenameIndex
ALTER INDEX "JenisKekerasan_nama_key" RENAME TO "jenis_kekerasan_nama_key";

-- RenameIndex
ALTER INDEX "JenisPendampingan_kode_key" RENAME TO "jenis_pendampingan_kode_key";

-- RenameIndex
ALTER INDEX "JenisPendampingan_nama_key" RENAME TO "jenis_pendampingan_nama_key";

-- RenameIndex
ALTER INDEX "Kecamatan_nama_key" RENAME TO "kecamatan_nama_key";

-- RenameIndex
ALTER INDEX "Laporan_kodePendaftaran_key" RENAME TO "laporan_kode_pendaftaran_key";

-- RenameIndex
ALTER INDEX "Laporan_status_dibuatPada_idx" RENAME TO "laporan_status_dibuat_pada_idx";

-- RenameIndex
ALTER INDEX "LaporanPendampingan_sesiId_key" RENAME TO "laporan_pendampingan_sesi_id_key";

-- RenameIndex
ALTER INDEX "LogAudit_entitas_entitasId_idx" RENAME TO "log_audit_entitas_entitas_id_idx";

-- RenameIndex
ALTER INDEX "Lokasi_nama_key" RENAME TO "lokasi_nama_key";

-- RenameIndex
ALTER INDEX "Pengguna_email_key" RENAME TO "pengguna_email_key";

-- RenameIndex
ALTER INDEX "RevisiLaporanPendampingan_laporanPendampinganId_versi_key" RENAME TO "revisi_laporan_pendampingan_laporan_pendampingan_id_versi_key";

-- RenameIndex
ALTER INDEX "Sesi_laporanId_urutan_key" RENAME TO "sesi_laporan_id_urutan_key";

-- RenameIndex
ALTER INDEX "Sesi_pendampingId_mulai_idx" RENAME TO "sesi_pendamping_id_mulai_idx";

-- RenameIndex
ALTER INDEX "Tiket_kodeCheckIn_key" RENAME TO "tiket_kode_check_in_key";

-- RenameIndex
ALTER INDEX "Tiket_lokasiId_jenisPendampingId_tanggal_urutan_key" RENAME TO "tiket_lokasi_id_jenis_pendamping_id_tanggal_urutan_key";

-- RenameIndex
ALTER INDEX "Tiket_lokasiId_tanggal_statusAntrean_idx" RENAME TO "tiket_lokasi_id_tanggal_status_antrean_idx";

-- RenameIndex
ALTER INDEX "Tiket_nomorAntrean_key" RENAME TO "tiket_nomor_antrean_key";

-- RenameIndex
ALTER INDEX "Tiket_sesiId_key" RENAME TO "tiket_sesi_id_key";

-- RenameIndex
ALTER INDEX "UsulanSesi_laporanPendampinganId_key" RENAME TO "usulan_sesi_laporan_pendampingan_id_key";

-- RenameIndex
ALTER INDEX "UsulanSesi_sesiHasilId_key" RENAME TO "usulan_sesi_sesi_hasil_id_key";
