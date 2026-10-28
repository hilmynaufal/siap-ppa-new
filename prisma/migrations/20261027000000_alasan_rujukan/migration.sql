-- K-54: "Lembaga rujukan" dan "Alasan" pada BAP kini berarti pihak yang merujuk pelapor ke SIAP PPA.
-- Isi lama tidak dihapus: kolom alasan hanya diganti nama, dan setiap nilai yang sudah terisi
-- dicatat dulu di log audit beserta arti lamanya agar tetap dapat dilacak bila nanti ditimpa.
INSERT INTO "log_audit" ("id", "pengguna_id", "aksi", "entitas", "entitas_id", "rincian", "dibuat_pada")
SELECT
    'k54_' || "id",
    NULL,
    'CADANGAN_RUJUKAN_K54',
    'Laporan',
    "id",
    jsonb_build_object(
        'kodePendaftaran', "kode_pendaftaran",
        'lembagaRujukan', "lembaga_rujukan",
        'alasanKebutuhan', "alasan_kebutuhan",
        'catatan', 'Nilai sebelum K-54, diisi petugas lewat Lengkapi BAP. Kolom alasan_kebutuhan diganti nama menjadi alasan_rujukan.'
    ),
    CURRENT_TIMESTAMP
FROM "laporan"
WHERE "lembaga_rujukan" IS NOT NULL OR "alasan_kebutuhan" IS NOT NULL;

-- AlterTable
ALTER TABLE "laporan" RENAME COLUMN "alasan_kebutuhan" TO "alasan_rujukan";
