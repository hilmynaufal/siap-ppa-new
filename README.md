# SIAP PPA New

Sistem pelaporan kasus kekerasan terhadap perempuan dan anak, Kabupaten Bandung (REQ/002/DISKOMINFO/2026).

Stack: TypeScript, Next.js (App Router), PostgreSQL, Prisma, zod, vitest. Lihat `AGENTS.md` untuk konvensi.

## Persiapan

```bash
npm install
cp .env.example .env   # DATABASE_URL untuk PostgreSQL lokal (lihat docker-compose.yml)
docker compose up -d --wait   # PostgreSQL lokal di port 5439
npx prisma migrate dev        # terapkan migrasi
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
