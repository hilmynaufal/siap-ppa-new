-- AlterEnum
ALTER TYPE "peran" ADD VALUE 'PETUGAS';

-- AlterTable
ALTER TABLE "pengguna" ADD COLUMN     "lokasi_id" TEXT;

-- AddForeignKey
ALTER TABLE "pengguna" ADD CONSTRAINT "pengguna_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
