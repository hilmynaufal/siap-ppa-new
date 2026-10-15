-- CreateTable
CREATE TABLE "pendampingan_diminta" (
    "laporan_id" TEXT NOT NULL,
    "jenis_pendamping_id" TEXT NOT NULL,

    CONSTRAINT "pendampingan_diminta_pkey" PRIMARY KEY ("laporan_id","jenis_pendamping_id")
);

-- CreateIndex
CREATE INDEX "pendampingan_diminta_jenis_pendamping_id_idx" ON "pendampingan_diminta"("jenis_pendamping_id");

-- AddForeignKey
ALTER TABLE "pendampingan_diminta" ADD CONSTRAINT "pendampingan_diminta_laporan_id_fkey" FOREIGN KEY ("laporan_id") REFERENCES "laporan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendampingan_diminta" ADD CONSTRAINT "pendampingan_diminta_jenis_pendamping_id_fkey" FOREIGN KEY ("jenis_pendamping_id") REFERENCES "jenis_pendampingan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

