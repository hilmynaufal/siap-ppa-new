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

// Contoh kontak darurat (nomor FIKTIF) agar halaman Pelapor dapat dicoba. Data resmi diisi Admin di halaman Kontak Darurat.
const KONTAK_UJI = [
  { instansi: "UPTD PPA Kabupaten Bandung", telepon: "(022) 5890 0000", alamat: "Jl. Raya Soreang-Banjaran, Soreang", kecamatan: null },
  { instansi: "Satgas PPA Kecamatan Soreang", telepon: "(022) 5891 0000", alamat: "Kantor Kecamatan Soreang", kecamatan: "Soreang" },
  { instansi: "Satgas PPA Kecamatan Baleendah", telepon: "(022) 5940 0000", alamat: "Kantor Kecamatan Baleendah, Jl. Adipati Agung No. 1", kecamatan: "Baleendah" },
  { instansi: "Satgas PPA Kecamatan Banjaran", telepon: "(022) 5941 0000", alamat: "Kantor Kecamatan Banjaran", kecamatan: "Banjaran" },
];

// Contoh jenis pendampingan dan lokasi (FIKTIF) agar jadwal dan tiket dapat dicoba. Data resmi dikelola oleh pengelola data master.
const PENDAMPINGAN_UJI = [
  { kode: "PSI", nama: "Pendampingan psikologis" },
  { kode: "HUK", nama: "Pendampingan hukum" },
  { kode: "MED", nama: "Pendampingan medis" },
];
// Contoh desa FIKTIF untuk menguji formulir lokal. Data resmi diimpor Admin lewat CSV di halaman Desa/Kelurahan.
const DESA_UJI = [
  { kecamatan: "Soreang", nama: "Desa Contoh Satu" },
  { kecamatan: "Soreang", nama: "Kelurahan Contoh Dua" },
  { kecamatan: "Baleendah", nama: "Desa Contoh Tiga" },
];
const LOKASI_UJI = [{ nama: "Kantor UPTD PPA (contoh)", alamat: "Jl. Raya Soreang-Banjaran, Soreang" }];

async function main() {
  for (const a of AKUN_UJI) {
    await db.pengguna.upsert({
      where: { email: a.email },
      update: {},
      create: { nama: a.nama, email: a.email, kataSandiHash: await hashPassword(a.kataSandi), peran: a.peran },
    });
  }
  for (const j of PENDAMPINGAN_UJI) {
    await db.jenisPendampingan.upsert({ where: { kode: j.kode }, update: {}, create: j });
  }
  for (const l of LOKASI_UJI) {
    await db.lokasi.upsert({ where: { nama: l.nama }, update: {}, create: l });
  }
  for (const d of DESA_UJI) {
    const kec = await db.kecamatan.findUniqueOrThrow({ where: { nama: d.kecamatan } });
    await db.desa.upsert({ where: { kecamatanId_nama: { kecamatanId: kec.id, nama: d.nama } }, update: {}, create: { kecamatanId: kec.id, nama: d.nama } });
  }
  const psi = await db.jenisPendampingan.findUniqueOrThrow({ where: { kode: "PSI" } });
  await db.pengguna.updateMany({ where: { email: "pendamping@contoh.test", jenisPendampingId: null }, data: { jenisPendampingId: psi.id } });
  for (const nama of JENIS_UJI) {
    await db.jenisKekerasan.upsert({ where: { nama }, update: {}, create: { nama } });
  }
  for (const k of KONTAK_UJI) {
    const kec = k.kecamatan ? await db.kecamatan.findUnique({ where: { nama: k.kecamatan } }) : null;
    const ada = await db.kontakDarurat.findFirst({ where: { instansi: k.instansi } });
    if (!ada) await db.kontakDarurat.create({ data: { instansi: k.instansi, telepon: k.telepon, alamat: k.alamat, kecamatanId: kec?.id ?? null } });
  }
  console.log(`Seed: ${AKUN_UJI.length} akun uji, ${JENIS_UJI.length} jenis kekerasan, ${KONTAK_UJI.length} kontak darurat, ${PENDAMPINGAN_UJI.length} jenis pendampingan, ${LOKASI_UJI.length} lokasi, ${DESA_UJI.length} desa contoh.`);
}

main().finally(() => db.$disconnect());
