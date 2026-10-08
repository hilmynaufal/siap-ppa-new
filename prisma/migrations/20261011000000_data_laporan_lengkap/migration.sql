-- CreateEnum
CREATE TYPE "jenis_kelamin" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

-- CreateEnum
CREATE TYPE "pendidikan" AS ENUM ('BELUM_SEKOLAH', 'TIDAK_SEKOLAH', 'SD', 'SMP', 'SMA', 'DIPLOMA', 'SARJANA', 'PASCASARJANA');

-- CreateEnum
CREATE TYPE "status_perkawinan" AS ENUM ('BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI');

-- CreateTable
CREATE TABLE "pelapor" (
    "id" TEXT NOT NULL,
    "laporan_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nik_cipher" TEXT,
    "nik_indeks" TEXT,
    "hubungan_id" TEXT,
    "kontak" TEXT NOT NULL,
    "alamat" TEXT,
    "kecamatan_id" TEXT,
    "desa_id" TEXT,

    CONSTRAINT "pelapor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "korban" (
    "id" TEXT NOT NULL,
    "laporan_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nik_cipher" TEXT,
    "nik_indeks" TEXT,
    "jenis_kelamin" "jenis_kelamin",
    "tempat_lahir" TEXT,
    "tanggal_lahir" DATE,
    "pendidikan" "pendidikan",
    "pekerjaan_id" TEXT,
    "status_perkawinan" "status_perkawinan",
    "kontak" TEXT,
    "alamat" TEXT,
    "kecamatan_id" TEXT,
    "desa_id" TEXT,

    CONSTRAINT "korban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terlapor" (
    "id" TEXT NOT NULL,
    "laporan_id" TEXT NOT NULL,
    "nama" TEXT,
    "jenis_kelamin" "jenis_kelamin",
    "usia" INTEGER,
    "hubungan_id" TEXT,
    "alamat" TEXT,

    CONSTRAINT "terlapor_pkey" PRIMARY KEY ("id")
);

-- Memindahkan data pelapor dan korban dari kolom lama ke tabel baru sebelum kolom lama dihapus.
-- Usia lama tidak dapat diubah menjadi tanggal lahir yang benar, sehingga tidak dipindahkan (belum ada data nyata saat revisi ini dibuat).
-- Kecamatan lama adalah kecamatan tempat kejadian; dipakai sebagai kecamatan korban sementara agar data lama tetap terfilter.
INSERT INTO "pelapor" ("id", "laporan_id", "nama", "kontak")
SELECT 'mig_p_' || "id", "id", "nama_pelapor", "kontak_pelapor" FROM "laporan";

INSERT INTO "korban" ("id", "laporan_id", "nama", "jenis_kelamin", "kecamatan_id")
SELECT 'mig_k_' || "id", "id", "nama_korban",
       CASE "jenis_kelamin_korban" WHEN 'Perempuan' THEN 'PEREMPUAN'::"jenis_kelamin" WHEN 'Laki-laki' THEN 'LAKI_LAKI'::"jenis_kelamin" END,
       "kecamatan_id"
FROM "laporan";

-- DropForeignKey
ALTER TABLE "laporan" DROP CONSTRAINT "laporan_kecamatan_id_fkey";

-- AlterTable
ALTER TABLE "laporan" DROP COLUMN "jenis_kelamin_korban",
DROP COLUMN "kecamatan_id",
DROP COLUMN "kontak_pelapor",
DROP COLUMN "nama_korban",
DROP COLUMN "nama_pelapor",
DROP COLUMN "usia_korban",
ADD COLUMN     "pelapor_adalah_korban" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "pelapor_laporan_id_key" ON "pelapor"("laporan_id");

-- CreateIndex
CREATE INDEX "pelapor_nik_indeks_idx" ON "pelapor"("nik_indeks");

-- CreateIndex
CREATE UNIQUE INDEX "korban_laporan_id_key" ON "korban"("laporan_id");

-- CreateIndex
CREATE INDEX "korban_nik_indeks_idx" ON "korban"("nik_indeks");

-- CreateIndex
CREATE INDEX "korban_kecamatan_id_idx" ON "korban"("kecamatan_id");

-- CreateIndex
CREATE INDEX "terlapor_laporan_id_idx" ON "terlapor"("laporan_id");

-- AddForeignKey
ALTER TABLE "pelapor" ADD CONSTRAINT "pelapor_laporan_id_fkey" FOREIGN KEY ("laporan_id") REFERENCES "laporan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelapor" ADD CONSTRAINT "pelapor_hubungan_id_fkey" FOREIGN KEY ("hubungan_id") REFERENCES "hubungan_korban"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelapor" ADD CONSTRAINT "pelapor_kecamatan_id_fkey" FOREIGN KEY ("kecamatan_id") REFERENCES "kecamatan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelapor" ADD CONSTRAINT "pelapor_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "korban" ADD CONSTRAINT "korban_laporan_id_fkey" FOREIGN KEY ("laporan_id") REFERENCES "laporan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "korban" ADD CONSTRAINT "korban_pekerjaan_id_fkey" FOREIGN KEY ("pekerjaan_id") REFERENCES "pekerjaan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "korban" ADD CONSTRAINT "korban_kecamatan_id_fkey" FOREIGN KEY ("kecamatan_id") REFERENCES "kecamatan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "korban" ADD CONSTRAINT "korban_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terlapor" ADD CONSTRAINT "terlapor_laporan_id_fkey" FOREIGN KEY ("laporan_id") REFERENCES "laporan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terlapor" ADD CONSTRAINT "terlapor_hubungan_id_fkey" FOREIGN KEY ("hubungan_id") REFERENCES "hubungan_korban"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
