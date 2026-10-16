import * as z from "zod";
import type { PrismaClient } from "@/generated/prisma/client";

/** Penandatangan BAP. Disimpan di tabel pengaturan agar dapat diganti Admin tanpa mengubah kode. */
export const KUNCI_KEPALA_NAMA = "kepala_uptd_nama";
export const KUNCI_KEPALA_NIP = "kepala_uptd_nip";

export type PengaturanBap = { kepalaUptdNama: string; kepalaUptdNip: string };

export const SkemaPengaturanBap = z.object({
  kepalaUptdNama: z
    .string()
    .trim()
    .min(3, { error: "Nama Kepala UPTD wajib diisi (minimal 3 huruf)." })
    .max(120, { error: "Nama terlalu panjang (maksimal 120 huruf)." }),
  kepalaUptdNip: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{18}$/, { error: "NIP harus 18 digit angka." })),
});

export async function bacaPengaturanBap(db: PrismaClient): Promise<PengaturanBap> {
  const rows = await db.pengaturan.findMany({ where: { kunci: { in: [KUNCI_KEPALA_NAMA, KUNCI_KEPALA_NIP] } } });
  const nilai = (k: string) => rows.find((r) => r.kunci === k)?.nilai ?? "";
  return { kepalaUptdNama: nilai(KUNCI_KEPALA_NAMA), kepalaUptdNip: nilai(KUNCI_KEPALA_NIP) };
}

export type HasilPengaturan = { ok: true } | { ok: false; pesan: string; galat?: Partial<Record<keyof PengaturanBap, string>> };

/** Menyimpan penandatangan BAP dan mencatat nilai sebelum dan sesudahnya di log audit. */
export async function simpanPengaturanBap(db: PrismaClient, mentah: unknown, adminId: string): Promise<HasilPengaturan> {
  const p = SkemaPengaturanBap.safeParse(mentah);
  if (!p.success) {
    const galat: Partial<Record<keyof PengaturanBap, string>> = {};
    for (const i of p.error.issues) {
      const k = String(i.path[0]) as keyof PengaturanBap;
      if (!galat[k]) galat[k] = i.message;
    }
    return { ok: false, pesan: "Periksa isian yang ditandai.", galat };
  }
  const sebelum = await bacaPengaturanBap(db);
  const sesudah = p.data;
  if (sebelum.kepalaUptdNama === sesudah.kepalaUptdNama && sebelum.kepalaUptdNip === sesudah.kepalaUptdNip) return { ok: true };
  await db.$transaction(async (tx) => {
    for (const [kunci, nilai] of [
      [KUNCI_KEPALA_NAMA, sesudah.kepalaUptdNama],
      [KUNCI_KEPALA_NIP, sesudah.kepalaUptdNip],
    ] as const) {
      await tx.pengaturan.upsert({ where: { kunci }, update: { nilai, diubahOlehId: adminId }, create: { kunci, nilai, diubahOlehId: adminId } });
    }
    await tx.logAudit.create({
      data: { penggunaId: adminId, aksi: "UBAH_PENGATURAN_BAP", entitas: "Pengaturan", entitasId: "kepala_uptd", rincian: { sebelum, sesudah } },
    });
  });
  return { ok: true };
}
