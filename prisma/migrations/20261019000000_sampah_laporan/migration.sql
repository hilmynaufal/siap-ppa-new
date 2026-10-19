-- AlterTable
ALTER TABLE "laporan" ADD COLUMN     "alasan_hapus" TEXT,
ADD COLUMN     "dihapus_oleh_id" TEXT,
ADD COLUMN     "dihapus_pada" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "laporan_dihapus_pada_idx" ON "laporan"("dihapus_pada");

-- AddForeignKey
ALTER TABLE "laporan" ADD CONSTRAINT "laporan_dihapus_oleh_id_fkey" FOREIGN KEY ("dihapus_oleh_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

