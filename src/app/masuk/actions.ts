"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/lib/db";
import { berandaUntuk } from "@/lib/akses";
import { buatSesi, hapusSesi } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

const MasukSchema = z.object({
  email: z.email({ error: "Masukkan alamat email yang valid." }).trim().toLowerCase(),
  kataSandi: z.string().min(1, { error: "Kata sandi wajib diisi." }),
});

export type MasukState =
  | { errors?: { email?: string[]; kataSandi?: string[] }; message?: string }
  | undefined;

const PESAN_GAGAL = "Email atau kata sandi tidak sesuai.";

// Pembatasan percobaan sederhana (per proses): 5 kali gagal per email dalam 15 menit.
const percobaan = new Map<string, { jumlah: number; sampai: number }>();
const BATAS = 5;
const JENDELA_MS = 15 * 60 * 1000;

function terkunci(email: string) {
  const p = percobaan.get(email);
  if (!p) return false;
  if (p.sampai < Date.now()) {
    percobaan.delete(email);
    return false;
  }
  return p.jumlah >= BATAS;
}

function catatGagal(email: string) {
  const p = percobaan.get(email);
  if (!p || p.sampai < Date.now()) percobaan.set(email, { jumlah: 1, sampai: Date.now() + JENDELA_MS });
  else p.jumlah += 1;
}

// Hash tiruan agar waktu respons sama baik email ada maupun tidak.
const HASH_TIRUAN = hashPassword("tiruan-tidak-dipakai");

export async function masuk(_state: MasukState, formData: FormData): Promise<MasukState> {
  const hasil = MasukSchema.safeParse({
    email: formData.get("email"),
    kataSandi: formData.get("kataSandi"),
  });
  if (!hasil.success) return { errors: z.flattenError(hasil.error).fieldErrors };

  const { email, kataSandi } = hasil.data;
  if (terkunci(email)) {
    return { message: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." };
  }

  const pengguna = await db.pengguna.findUnique({ where: { email } });
  const sah = await verifyPassword(kataSandi, pengguna?.kataSandiHash ?? (await HASH_TIRUAN));
  if (!pengguna || !sah || !pengguna.aktif) {
    catatGagal(email);
    return { message: PESAN_GAGAL };
  }

  percobaan.delete(email);
  await buatSesi(pengguna.id, pengguna.peran);
  await db.logAudit.create({
    data: { penggunaId: pengguna.id, aksi: "MASUK", entitas: "Pengguna", entitasId: pengguna.id },
  });
  redirect(berandaUntuk(pengguna.peran));
}

export async function keluar() {
  await hapusSesi();
  redirect("/masuk");
}
