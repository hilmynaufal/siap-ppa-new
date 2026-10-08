-- CreateTable
CREATE TABLE "desa" (
    "id" TEXT NOT NULL,
    "kecamatan_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubah_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "desa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubungan_korban" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubah_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hubungan_korban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pekerjaan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubah_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pekerjaan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "desa_kode_key" ON "desa"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "desa_kecamatan_id_nama_key" ON "desa"("kecamatan_id", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "hubungan_korban_nama_key" ON "hubungan_korban"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "pekerjaan_nama_key" ON "pekerjaan"("nama");

-- AddForeignKey
ALTER TABLE "desa" ADD CONSTRAINT "desa_kecamatan_id_fkey" FOREIGN KEY ("kecamatan_id") REFERENCES "kecamatan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Nilai awal umum (bukan data pribadi); Admin dapat mengubah, menambah, atau menonaktifkannya.
INSERT INTO "hubungan_korban" ("id", "nama", "urutan") VALUES
    ('hub_orang_tua', 'Orang tua', 10),
    ('hub_anak', 'Anak', 20),
    ('hub_pasangan', 'Suami/Istri', 30),
    ('hub_mantan_pasangan', 'Pasangan/Mantan pasangan', 40),
    ('hub_saudara', 'Saudara kandung', 50),
    ('hub_keluarga_lain', 'Keluarga lain', 60),
    ('hub_tetangga', 'Tetangga', 70),
    ('hub_teman', 'Teman', 80),
    ('hub_guru', 'Guru/Pihak sekolah', 90),
    ('hub_majikan', 'Majikan/Atasan', 100),
    ('hub_petugas', 'Petugas/Relawan', 110),
    ('hub_tidak_kenal', 'Tidak dikenal', 120),
    ('hub_lainnya', 'Lainnya', 900)
ON CONFLICT ("nama") DO NOTHING;

INSERT INTO "pekerjaan" ("id", "nama", "urutan") VALUES
    ('pkj_belum_sekolah', 'Belum sekolah', 10),
    ('pkj_pelajar', 'Pelajar/Mahasiswa', 20),
    ('pkj_irt', 'Ibu rumah tangga', 30),
    ('pkj_tidak_bekerja', 'Tidak bekerja', 40),
    ('pkj_swasta', 'Karyawan swasta', 50),
    ('pkj_asn', 'ASN/TNI/Polri', 60),
    ('pkj_wiraswasta', 'Wiraswasta', 70),
    ('pkj_buruh', 'Buruh', 80),
    ('pkj_petani', 'Petani/Pekebun', 90),
    ('pkj_pedagang', 'Pedagang', 100),
    ('pkj_lainnya', 'Lainnya', 900)
ON CONFLICT ("nama") DO NOTHING;
