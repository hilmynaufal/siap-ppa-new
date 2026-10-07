// Membuat atau memperbarui akun Admin dari variabel lingkungan, tanpa menyimpan data apa pun di repositori.
//   ADMIN_NAMA="Nama Admin" ADMIN_EMAIL=admin@instansi.go.id ADMIN_PASSWORD=... npm run admin:buat
// Kata sandi tidak dicetak. Bila email sudah ada sebagai Admin, kata sandi dan nama diperbarui.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as z from "zod";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const Skema = z.object({
  ADMIN_NAMA: z.string().trim().min(3, "ADMIN_NAMA minimal 3 huruf").max(100),
  ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email("ADMIN_EMAIL bukan email yang valid")),
  ADMIN_PASSWORD: z.string().min(12, "ADMIN_PASSWORD minimal 12 karakter").max(200),
});

async function main() {
  const p = Skema.safeParse(process.env);
  if (!p.success) {
    console.error(p.error.issues.map((i) => `- ${i.message}`).join("\n"));
    process.exit(1);
  }
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const ada = await db.pengguna.findUnique({ where: { email: p.data.ADMIN_EMAIL } });
    if (ada && ada.peran !== "ADMIN") {
      console.error("Email ini sudah dipakai akun non-Admin. Gunakan email lain.");
      process.exit(1);
    }
    const kataSandiHash = await hashPassword(p.data.ADMIN_PASSWORD);
    await db.pengguna.upsert({
      where: { email: p.data.ADMIN_EMAIL },
      update: { nama: p.data.ADMIN_NAMA, kataSandiHash, aktif: true },
      create: { nama: p.data.ADMIN_NAMA, email: p.data.ADMIN_EMAIL, kataSandiHash, peran: "ADMIN" },
    });
    console.log(`${ada ? "Diperbarui" : "Dibuat"}: akun Admin ${p.data.ADMIN_EMAIL}`);
  } finally {
    await db.$disconnect();
  }
}

main();
