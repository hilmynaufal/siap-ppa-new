-- AlterTable
ALTER TABLE "notifikasi" ADD COLUMN     "dibaca_pada" TIMESTAMP(3),
ADD COLUMN     "penerima_id" TEXT;

-- CreateIndex
CREATE INDEX "notifikasi_penerima_id_dibaca_pada_idx" ON "notifikasi"("penerima_id", "dibaca_pada");

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_penerima_id_fkey" FOREIGN KEY ("penerima_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;
