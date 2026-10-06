-- AlterTable
ALTER TABLE "kontak_darurat" ADD COLUMN     "dibuat_oleh_id" TEXT,
ADD COLUMN     "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diubah_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "kontak_darurat" ADD CONSTRAINT "kontak_darurat_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;
