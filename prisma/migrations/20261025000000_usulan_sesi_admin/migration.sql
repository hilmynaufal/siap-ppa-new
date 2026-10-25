-- Usulan sesi lanjutan dapat dicatat Admin (tanpa laporan pendampingan).

-- Kolom baru; laporan_id diisi dulu untuk usulan lama sebelum dijadikan wajib.
ALTER TABLE "usulan_sesi" ADD COLUMN "laporan_id" TEXT,
ADD COLUMN "diajukan_oleh_id" TEXT,
ADD COLUMN "jenis_pendamping_id" TEXT,
ADD COLUMN "pendamping_id" TEXT,
ADD COLUMN "alasan" TEXT;

UPDATE "usulan_sesi" u
SET "laporan_id" = s."laporan_id"
FROM "laporan_pendampingan" lp
JOIN "sesi" s ON s."id" = lp."sesi_id"
WHERE lp."id" = u."laporan_pendampingan_id";

ALTER TABLE "usulan_sesi" ALTER COLUMN "laporan_id" SET NOT NULL;
ALTER TABLE "usulan_sesi" ALTER COLUMN "laporan_pendampingan_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "usulan_sesi_laporan_id_status_idx" ON "usulan_sesi"("laporan_id", "status");

-- AddForeignKey
ALTER TABLE "usulan_sesi" ADD CONSTRAINT "usulan_sesi_laporan_id_fkey" FOREIGN KEY ("laporan_id") REFERENCES "laporan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "usulan_sesi" ADD CONSTRAINT "usulan_sesi_diajukan_oleh_id_fkey" FOREIGN KEY ("diajukan_oleh_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "usulan_sesi" ADD CONSTRAINT "usulan_sesi_pendamping_id_fkey" FOREIGN KEY ("pendamping_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "usulan_sesi" ADD CONSTRAINT "usulan_sesi_jenis_pendamping_id_fkey" FOREIGN KEY ("jenis_pendamping_id") REFERENCES "jenis_pendampingan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
