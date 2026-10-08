import type { PrismaClient } from "@/generated/prisma/client";
import { dekripsiNik, indeksNik } from "./nik";
import { bersihkanNik, nikValid } from "./nik-format";

/**
 * Akses ke NIK utuh. Membuka NIK dan mencari lewat NIK selalu meninggalkan jejak di audit log
 * (siapa, kapan, laporan mana), tetapi NIK itu sendiri tidak pernah ditulis ke log.
 */

export type PihakNik = "KORBAN" | "PELAPOR";

export type HasilBukaNik = { ok: true; nik: string } | { ok: false; pesan: string };

/** Membuka NIK utuh seorang pihak pada satu laporan. Audit ditulis lebih dulu; bila gagal, NIK tidak dikembalikan. */
export async function bukaNik(db: PrismaClient, laporanId: string, pihak: PihakNik, adminId: string): Promise<HasilBukaNik> {
  const l = await db.laporan.findUnique({
    where: { id: laporanId },
    select: { pelapor: { select: { nikCipher: true } }, korban: { select: { nikCipher: true } } },
  });
  if (!l) return { ok: false, pesan: "Laporan tidak ditemukan." };
  const cipher = pihak === "KORBAN" ? l.korban?.nikCipher : l.pelapor?.nikCipher;
  if (!cipher) return { ok: false, pesan: "NIK tidak tersedia pada laporan ini." };

  let nik: string;
  try {
    nik = dekripsiNik(cipher);
  } catch {
    return { ok: false, pesan: "NIK tidak dapat dibuka. Periksa DATA_KEY di server." };
  }
  await db.logAudit.create({
    data: { penggunaId: adminId, aksi: "LIHAT_NIK", entitas: "Laporan", entitasId: laporanId, rincian: { pihak } },
  });
  return { ok: true, nik };
}

export type HasilCariNik = { ok: true; laporanIds: string[] } | { ok: false; pesan: string };

/** Mencari laporan lewat NIK (sebagai korban atau pelapor) memakai indeks HMAC. Pencarian dicatat di audit tanpa NIK-nya. */
export async function cariLaporanByNik(db: PrismaClient, nikMentah: string, adminId: string): Promise<HasilCariNik> {
  const nik = bersihkanNik(nikMentah);
  if (!nikValid(nik)) return { ok: false, pesan: "NIK harus 16 digit angka dan berformat benar." };
  const indeks = indeksNik(nik);
  const [korban, pelapor] = await Promise.all([
    db.korban.findMany({ where: { nikIndeks: indeks }, select: { laporanId: true } }),
    db.pelapor.findMany({ where: { nikIndeks: indeks }, select: { laporanId: true } }),
  ]);
  const laporanIds = [...new Set([...korban, ...pelapor].map((x) => x.laporanId))];
  await db.logAudit.create({
    data: { penggunaId: adminId, aksi: "CARI_NIK", entitas: "Laporan", entitasId: "pencarian", rincian: { jumlahHasil: laporanIds.length } },
  });
  return { ok: true, laporanIds };
}

/** Laporan lain yang memuat NIK yang sama dengan korban atau pelapor laporan ini (untuk mendeteksi laporan berulang). */
export async function laporanTerkait(db: PrismaClient, laporanId: string) {
  const l = await db.laporan.findUnique({
    where: { id: laporanId },
    select: { pelapor: { select: { nikIndeks: true } }, korban: { select: { nikIndeks: true } } },
  });
  const indeks = [l?.korban?.nikIndeks, l?.pelapor?.nikIndeks].filter((x): x is string => !!x);
  if (indeks.length === 0) return [];
  const rows = await db.laporan.findMany({
    where: { id: { not: laporanId }, OR: [{ korban: { nikIndeks: { in: indeks } } }, { pelapor: { nikIndeks: { in: indeks } } }] },
    orderBy: { dibuatPada: "desc" },
    take: 20,
    select: {
      id: true,
      kodePendaftaran: true,
      status: true,
      dibuatPada: true,
      korban: { select: { nikIndeks: true } },
      pelapor: { select: { nikIndeks: true } },
    },
  });
  const korbanIni = l?.korban?.nikIndeks;
  return rows.map((r) => ({
    id: r.id,
    kode: r.kodePendaftaran,
    status: r.status,
    dibuatPada: r.dibuatPada.toISOString(),
    // Hubungan dengan laporan ini, tanpa menyebut NIK-nya.
    keterangan:
      korbanIni && r.korban?.nikIndeks === korbanIni
        ? "Korban yang sama"
        : korbanIni && r.pelapor?.nikIndeks === korbanIni
          ? "Korban ini pernah menjadi pelapor"
          : r.korban?.nikIndeks && r.korban.nikIndeks === l?.pelapor?.nikIndeks
            ? "Pelapor ini pernah menjadi korban"
            : "Pelapor yang sama",
  }));
}
