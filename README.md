# SIAP PPA New

Sistem pelaporan kasus kekerasan terhadap perempuan dan anak, Kabupaten Bandung (REQ/002/DISKOMINFO/2026).

Stack: TypeScript, Next.js (App Router), PostgreSQL, Prisma, zod, vitest. Lihat `AGENTS.md` untuk konvensi.

## Persiapan

```bash
npm install
cp .env.example .env   # isi juga SESSION_SECRET (acak, min. 32 karakter); DATABASE_URL untuk PostgreSQL lokal (lihat docker-compose.yml)
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

`SESSION_SECRET` wajib acak (min. 32 karakter). Berkas unggahan: pasang volume pada `/data/uploads`.

## CI

GitHub Actions (`.github/workflows/ci.yml`) berjalan pada setiap push dan PR: validasi skema, migrasi dari nol di PostgreSQL, ERD sesuai skema, lint, cek tipe, uji, dan build. Lockfile harus lengkap untuk Linux; bila `npm ci` gagal karena `package-lock.json`, hasilkan ulang di Linux (mis. container `node:22`).

## Penamaan basis data

Di basis data semua nama memakai `snake_case` dan tabel berbentuk tunggal (`jenis_kekerasan`, kolom `dibuat_pada`). Di kode TypeScript nama tetap `PascalCase` untuk model dan `camelCase` untuk field (`db.jenisKekerasan`, `dibuatPada`). Pemetaannya lewat `@@map` dan `@map` di `prisma/schema.prisma`; setiap model, field, dan enum baru wajib diberi pemetaan. ERD (`npm run erd`) menampilkan nama di basis data.
