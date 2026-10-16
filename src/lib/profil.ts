import * as z from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { hashPassword, verifyPassword } from "./password";

/**
 * Profil milik pengguna yang sedang masuk (Admin, Pendamping, Petugas): ubah nama tampilan dan ganti kata sandi.
 * Email adalah identitas masuk, sehingga hanya diubah Admin lewat pengelolaan akun.
 */

export const MIN_KATA_SANDI = 12;

export type Hasil<K extends string> = { ok: true } | { ok: false; pesan: string; galat?: Partial<Record<K, string>> };

function galatDari<K extends string>(e: z.ZodError): Partial<Record<K, string>> {
  const g: Partial<Record<K, string>> = {};
  for (const i of e.issues) {
    const k = String(i.path[0]) as K;
    if (!g[k]) g[k] = i.message;
  }
  return g;
}

export const SkemaNama = z.object({
  nama: z
    .string()
    .trim()
    .min(3, { error: "Nama wajib diisi (minimal 3 huruf)." })
    .max(120, { error: "Nama terlalu panjang (maksimal 120 huruf)." }),
});

export async function ubahNamaSendiri(db: PrismaClient, penggunaId: string, mentah: unknown): Promise<Hasil<"nama">> {
  const p = SkemaNama.safeParse(mentah);
  if (!p.success) return { ok: false, pesan: "Periksa isian yang ditandai.", galat: galatDari(p.error) };
  const lama = await db.pengguna.findUnique({ where: { id: penggunaId }, select: { nama: true } });
  if (!lama) return { ok: false, pesan: "Akun tidak ditemukan." };
  if (lama.nama === p.data.nama) return { ok: true };
  await db.$transaction([
    db.pengguna.update({ where: { id: penggunaId }, data: { nama: p.data.nama } }),
    db.logAudit.create({ data: { penggunaId, aksi: "UBAH_PROFIL", entitas: "Pengguna", entitasId: penggunaId, rincian: { nama: { dari: lama.nama, ke: p.data.nama } } } }),
  ]);
  return { ok: true };
}

export const SkemaKataSandi = z
  .object({
    lama: z.string().min(1, { error: "Masukkan kata sandi saat ini." }),
    baru: z
      .string()
      .min(MIN_KATA_SANDI, { error: `Kata sandi baru minimal ${MIN_KATA_SANDI} karakter.` })
      .max(128, { error: "Kata sandi baru terlalu panjang (maksimal 128 karakter)." }),
    ulangi: z.string(),
  })
  .superRefine((d, ctx) => {
    if (d.baru && d.baru === d.lama) ctx.addIssue({ code: "custom", path: ["baru"], message: "Kata sandi baru harus berbeda dari yang sekarang." });
    if (d.ulangi !== d.baru) ctx.addIssue({ code: "custom", path: ["ulangi"], message: "Ulangi kata sandi baru dengan tepat." });
  });

/** Mengganti kata sandi sendiri setelah memeriksa kata sandi lama. Audit tidak pernah memuat kata sandi. */
export async function gantiKataSandiSendiri(db: PrismaClient, penggunaId: string, mentah: unknown): Promise<Hasil<"lama" | "baru" | "ulangi">> {
  const p = SkemaKataSandi.safeParse(mentah);
  if (!p.success) return { ok: false, pesan: "Periksa isian yang ditandai.", galat: galatDari(p.error) };
  const u = await db.pengguna.findUnique({ where: { id: penggunaId }, select: { kataSandiHash: true } });
  if (!u) return { ok: false, pesan: "Akun tidak ditemukan." };
  if (!(await verifyPassword(p.data.lama, u.kataSandiHash))) {
    await db.logAudit.create({ data: { penggunaId, aksi: "GANTI_KATA_SANDI_GAGAL", entitas: "Pengguna", entitasId: penggunaId } });
    return { ok: false, pesan: "Kata sandi saat ini salah.", galat: { lama: "Kata sandi saat ini salah." } };
  }
  const hash = await hashPassword(p.data.baru);
  await db.$transaction([
    db.pengguna.update({ where: { id: penggunaId }, data: { kataSandiHash: hash } }),
    db.logAudit.create({ data: { penggunaId, aksi: "GANTI_KATA_SANDI", entitas: "Pengguna", entitasId: penggunaId } }),
  ]);
  return { ok: true };
}
