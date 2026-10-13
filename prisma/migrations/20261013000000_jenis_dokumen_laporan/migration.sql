-- CreateEnum
CREATE TYPE "jenis_dokumen" AS ENUM ('KK', 'KTP', 'AKTA_KELAHIRAN', 'SURAT_NIKAH', 'SURAT_CERAI', 'BPJS');

-- AlterTable
ALTER TABLE "dokumen_laporan" ADD COLUMN     "jenis" "jenis_dokumen";
