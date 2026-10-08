# SIAP PPA New

Sistem pelaporan kasus kekerasan terhadap perempuan dan anak, Kabupaten Bandung (REQ/002/DISKOMINFO/2026).

Stack: TypeScript, Next.js (App Router), PostgreSQL, Prisma, zod, vitest. Lihat `AGENTS.md` untuk konvensi.

## Persiapan

```bash
npm install
cp .env.example .env   # isi juga SESSION_SECRET (acak, min. 32 karakter) dan DATA_KEY (kunci enkripsi NIK, lihat bawah); DATABASE_URL untuk PostgreSQL lokal (lihat docker-compose.yml)
docker compose up -d --wait   # PostgreSQL lokal di port 5439
npx prisma migrate dev        # terapkan migrasi
npx prisma db seed            # akun uji lokal (lihat prisma/seed.ts)
```

## Perintah

| Keperluan | Perintah |
|---|---|
| Menjalankan (dev) | `npm run dev` (http://localhost:3000) |
| Menguji | `npm test` |
| Membangun | `npm run build` |
| Migrasi basis data | `npx prisma migrate deploy` |
| Lint | `npm run lint` |
| ERD (Mermaid, dari skema Prisma) | `npm run erd` -> `docs/erd.mmd` |

## Docker (staging)

```bash
docker build -t siap-ppa .                                # image aplikasi
docker build --target migrasi -t siap-ppa-migrasi .       # image migrasi
docker run --rm -e DATABASE_URL=... siap-ppa-migrasi      # jalankan migrasi dahulu
docker run -d -p 3000:3000 -e DATABASE_URL=... -e SESSION_SECRET=... siap-ppa
```

`SESSION_SECRET` wajib acak (min. 32 karakter). `DATA_KEY` wajib untuk enkripsi NIK: 32 byte acak dalam base64 (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`). **Cadangkan kunci ini terpisah dari basis data**: bila hilang, NIK tersimpan tidak dapat dipulihkan. Berkas unggahan: pasang volume pada `/data/uploads`.

## CI

GitHub Actions (`.github/workflows/ci.yml`) berjalan pada setiap push dan PR: validasi skema, migrasi dari nol di PostgreSQL, ERD sesuai skema, lint, cek tipe, uji, dan build. Lockfile harus lengkap untuk Linux; bila `npm ci` gagal karena `package-lock.json`, hasilkan ulang di Linux (mis. container `node:22`).

## Penamaan basis data

Di basis data semua nama memakai `snake_case` dan tabel berbentuk tunggal (`jenis_kekerasan`, kolom `dibuat_pada`). Di kode TypeScript nama tetap `PascalCase` untuk model dan `camelCase` untuk field (`db.jenisKekerasan`, `dibuatPada`). Pemetaannya lewat `@@map` dan `@map` di `prisma/schema.prisma`; setiap model, field, dan enum baru wajib diberi pemetaan. ERD (`npm run erd`) menampilkan nama di basis data.

## Berkas unggahan

Dokumen pendukung laporan disimpan di luar akar web, di direktori `UPLOAD_DIR` (lokal: `uploads/`, Docker: volume `/data/uploads`), dengan nama acak. Hanya JPG, PNG, dan PDF (dicek dari isi berkas), maksimal 5 MB per berkas dan 3 berkas per laporan. Batas badan permintaan Server Action diatur 16 MB di `next.config.ts`. Data referensi 31 kecamatan Kabupaten Bandung ditanam lewat migrasi `data_kecamatan`; `npx prisma db seed` menambahkan contoh jenis kekerasan untuk pengembangan.

## Data awal produksi

Data nyata tidak disimpan di repositori. Isi lewat aplikasi atau perintah berikut.

1. **Akun Admin pertama** (dijalankan di server, kata sandi tidak dicetak dan tidak disimpan di berkas):

   ```bash
   ADMIN_NAMA="Nama Admin" ADMIN_EMAIL=admin@instansi.go.id ADMIN_PASSWORD="<minimal 12 karakter>" npm run admin:buat
   ```

   Menjalankan ulang dengan email yang sama memperbarui nama dan kata sandi.
2. **Data master** lewat menu Admin: Jenis Kekerasan, Jenis Pendampingan (kode dipakai sebagai awalan nomor antrean), Lokasi Layanan, Akun Pendamping (kata sandi sementara dibuat otomatis, tampil sekali, dan dapat diatur ulang), Hubungan dengan Korban dan Pekerjaan (nilai awal umum sudah terisi, dapat diubah), serta Desa/Kelurahan (kosong; isi lewat Impor CSV dari berkas resmi, kolom `kecamatan;desa;kode`).
3. **Kontak darurat** dapat diketik satu per satu atau diimpor dari CSV (menu Kontak Darurat, tombol Impor CSV; templat dapat diunduh di sana). Berkas diperiksa dulu dan hanya disimpan bila semua baris benar.
4. `npx prisma db seed` hanya untuk lingkungan lokal: berisi akun dan data contoh fiktif.

## Perlindungan NIK

- NIK pelapor dan korban disimpan terenkripsi (AES-256-GCM) dengan kunci `DATA_KEY`; basis data hanya memuat teks terenkripsi dan indeks HMAC.
- Halaman Admin menampilkan NIK tersamar. Tombol **Tampilkan** membuka NIK utuh selama 30 detik, dan **setiap pembukaan dan pencarian lewat NIK** tercatat di `log_audit` (siapa, kapan, laporan mana; NIK tidak pernah ditulis ke log).
- Laporan lain dengan NIK yang sama ditandai pada detail laporan (bagian Laporan terkait).
