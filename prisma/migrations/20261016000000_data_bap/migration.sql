-- CreateEnum
CREATE TYPE "status_bpjs" AS ENUM ('AKTIF', 'TIDAK_AKTIF', 'TIDAK_TAHU');

-- AlterEnum
ALTER TYPE "jenis_kelamin" ADD VALUE 'LAINNYA';

-- AlterTable
ALTER TABLE "korban" ADD COLUMN     "agama_id" TEXT,
ADD COLUMN     "alamat_ktp" TEXT,
ADD COLUMN     "nama_panggilan" TEXT,
ADD COLUMN     "no_bpjs" TEXT,
ADD COLUMN     "status_bpjs" "status_bpjs";

-- AlterTable
ALTER TABLE "laporan" ADD COLUMN     "alasan_kebutuhan" TEXT,
ADD COLUMN     "lembaga_rujukan" TEXT,
ADD COLUMN     "tempat_kejadian" TEXT;

-- AlterTable
ALTER TABLE "pelapor" ADD COLUMN     "agama_id" TEXT,
ADD COLUMN     "alamat_ktp" TEXT,
ADD COLUMN     "jenis_kelamin" "jenis_kelamin",
ADD COLUMN     "pekerjaan_id" TEXT,
ADD COLUMN     "pendidikan" "pendidikan",
ADD COLUMN     "status_perkawinan" "status_perkawinan",
ADD COLUMN     "tanggal_lahir" DATE,
ADD COLUMN     "tempat_lahir" TEXT;

-- AlterTable
ALTER TABLE "terlapor" ADD COLUMN     "agama_id" TEXT,
ADD COLUMN     "nama_panggilan" TEXT,
ADD COLUMN     "nik_cipher" TEXT,
ADD COLUMN     "nik_indeks" TEXT,
ADD COLUMN     "pekerjaan_id" TEXT,
ADD COLUMN     "pendidikan" "pendidikan",
ADD COLUMN     "tanggal_lahir" DATE,
ADD COLUMN     "tempat_lahir" TEXT;

-- CreateTable
CREATE TABLE "agama" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubah_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agama_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengaturan" (
    "kunci" TEXT NOT NULL,
    "nilai" TEXT NOT NULL,
    "diubah_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubah_oleh_id" TEXT,

    CONSTRAINT "pengaturan_pkey" PRIMARY KEY ("kunci")
);

-- CreateIndex
CREATE UNIQUE INDEX "agama_nama_key" ON "agama"("nama");

-- AddForeignKey
ALTER TABLE "pengaturan" ADD CONSTRAINT "pengaturan_diubah_oleh_id_fkey" FOREIGN KEY ("diubah_oleh_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelapor" ADD CONSTRAINT "pelapor_pekerjaan_id_fkey" FOREIGN KEY ("pekerjaan_id") REFERENCES "pekerjaan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelapor" ADD CONSTRAINT "pelapor_agama_id_fkey" FOREIGN KEY ("agama_id") REFERENCES "agama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "korban" ADD CONSTRAINT "korban_agama_id_fkey" FOREIGN KEY ("agama_id") REFERENCES "agama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terlapor" ADD CONSTRAINT "terlapor_pekerjaan_id_fkey" FOREIGN KEY ("pekerjaan_id") REFERENCES "pekerjaan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terlapor" ADD CONSTRAINT "terlapor_agama_id_fkey" FOREIGN KEY ("agama_id") REFERENCES "agama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Isi awal master agama (dapat diubah Admin).
INSERT INTO "agama" ("id", "nama", "urutan") VALUES
    ('agm_islam', 'Islam', 10),
    ('agm_kristen', 'Kristen', 20),
    ('agm_katolik', 'Katolik', 30),
    ('agm_hindu', 'Hindu', 40),
    ('agm_buddha', 'Buddha', 50),
    ('agm_konghucu', 'Konghucu', 60),
    ('agm_kepercayaan', 'Kepercayaan terhadap Tuhan YME', 70)
ON CONFLICT ("nama") DO NOTHING;
