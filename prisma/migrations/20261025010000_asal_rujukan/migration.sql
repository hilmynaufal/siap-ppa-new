-- AlterEnum
ALTER TYPE "jenis_dokumen" ADD VALUE 'SURAT_RUJUKAN';

-- AlterTable
ALTER TABLE "laporan" ADD COLUMN     "asal_rujukan_id" TEXT;

-- CreateTable
CREATE TABLE "asal_rujukan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "wajib_surat" BOOLEAN NOT NULL DEFAULT false,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubah_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asal_rujukan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asal_rujukan_nama_key" ON "asal_rujukan"("nama");

-- AddForeignKey
ALTER TABLE "laporan" ADD CONSTRAINT "laporan_asal_rujukan_id_fkey" FOREIGN KEY ("asal_rujukan_id") REFERENCES "asal_rujukan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Isi awal asal rujukan (dapat diubah Admin).
INSERT INTO "asal_rujukan" ("id", "nama", "urutan", "wajib_surat") VALUES
    ('rjk_hotline', 'Hotline', 10, false),
    ('rjk_sosmed', 'Media sosial', 20, false),
    ('rjk_uptd_prov', 'UPTD PPA Provinsi', 30, true),
    ('rjk_kepolisian', 'Kepolisian', 40, true)
ON CONFLICT ("nama") DO NOTHING;
