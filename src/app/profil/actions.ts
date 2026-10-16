"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { gantiKataSandiSendiri, ubahNamaSendiri } from "@/lib/profil";

export type AksiProfil = { ok?: boolean; pesan?: string; galat?: Record<string, string | undefined> } | undefined;

export async function ubahNamaAksi(_s: AksiProfil, fd: FormData): Promise<AksiProfil> {
  const pengguna = await wajibPeran("ADMIN", "PENDAMPING", "PETUGAS");
  const h = await ubahNamaSendiri(db, pengguna.id, { nama: String(fd.get("nama") ?? "") });
  if (!h.ok) return { pesan: h.pesan, galat: h.galat };
  // Nama tampil di kepala setiap halaman, jadi seluruh tata letak disegarkan.
  revalidatePath("/", "layout");
  return { ok: true, pesan: "Nama tersimpan." };
}

export async function gantiKataSandiAksi(_s: AksiProfil, fd: FormData): Promise<AksiProfil> {
  const pengguna = await wajibPeran("ADMIN", "PENDAMPING", "PETUGAS");
  const h = await gantiKataSandiSendiri(db, pengguna.id, {
    lama: String(fd.get("lama") ?? ""),
    baru: String(fd.get("baru") ?? ""),
    ulangi: String(fd.get("ulangi") ?? ""),
  });
  if (!h.ok) return { pesan: h.pesan, galat: h.galat };
  return { ok: true, pesan: "Kata sandi diganti. Gunakan kata sandi baru saat masuk berikutnya." };
}
