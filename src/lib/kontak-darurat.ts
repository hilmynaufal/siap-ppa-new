import type { PrismaClient } from "@/generated/prisma/client";

/** Kontak darurat yang aktif, untuk tombol Darurat dan daftar di beranda Pelapor. */
export async function kontakDaruratAktif(db: PrismaClient, jumlah = 3) {
  return db.kontakDarurat.findMany({
    where: { aktif: true },
    orderBy: { instansi: "asc" },
    take: jumlah,
    select: { id: true, instansi: true, telepon: true, alamat: true },
  });
}
