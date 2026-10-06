// Data uji LOKAL saja (jangan dipakai di produksi). Jalankan: npx prisma db seed
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const AKUN_UJI = [
  { nama: "Admin Uji", email: "admin@contoh.test", kataSandi: "Admin-Uji-123!", peran: "ADMIN" as const },
  { nama: "Pendamping Uji", email: "pendamping@contoh.test", kataSandi: "Pendamping-Uji-123!", peran: "PENDAMPING" as const },
];

// Contoh jenis kekerasan agar formulir pelaporan dapat dicoba. Daftar resmi dikelola Admin di halaman Jenis Kekerasan.
const JENIS_UJI = [
  "Kekerasan fisik",
  "Kekerasan psikis",
  "Kekerasan seksual",
  "Penelantaran",
  "Eksploitasi",
  "Perdagangan orang",
  "Lainnya",
];

async function main() {
  for (const a of AKUN_UJI) {
    await db.pengguna.upsert({
      where: { email: a.email },
      update: {},
      create: { nama: a.nama, email: a.email, kataSandiHash: await hashPassword(a.kataSandi), peran: a.peran },
    });
  }
  for (const nama of JENIS_UJI) {
    await db.jenisKekerasan.upsert({ where: { nama }, update: {}, create: { nama } });
  }
  console.log(`Seed: ${AKUN_UJI.length} akun uji, ${JENIS_UJI.length} jenis kekerasan contoh.`);
}

main().finally(() => db.$disconnect());
