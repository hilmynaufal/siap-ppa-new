"use server";

import { headers } from "next/headers";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { catatGagal, periksaLaju } from "@/lib/batas-laju";
import { cekTiket, type HasilCekTiket, type TiketPelapor } from "@/lib/tiket";

export type TiketDenganQr = TiketPelapor & { qrSvg: string };
export type HasilPeriksa =
  | Extract<HasilCekTiket, { ok: false }>
  | (Omit<Extract<HasilCekTiket, { ok: true }>, "tiket"> & { tiket: TiketDenganQr[] });

const MAKS_GAGAL = 10;
const JENDELA_MS = 60_000;

/**
 * Mengecek tiket dengan kode pendaftaran. Kode dikirim lewat POST (bukan di alamat halaman) agar tidak tersimpan
 * di riwayat peramban atau log. Tebakan yang gagal dibatasi per alamat IP.
 */
export async function periksaTiket(kode: string): Promise<HasilPeriksa> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "tidak-diketahui";
  const kunci = `cek-tiket:${ip}`;
  if (!periksaLaju(kunci, MAKS_GAGAL, JENDELA_MS).boleh) {
    return { ok: false, pesan: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi." };
  }
  const hasil = await cekTiket(db, String(kode ?? "").slice(0, 40));
  if (!hasil.ok) {
    catatGagal(kunci, JENDELA_MS);
    return hasil;
  }
  const tiket = await Promise.all(
    hasil.tiket.map(async (t) => ({
      ...t,
      qrSvg: await QRCode.toString(t.kodeCheckIn, { type: "svg", margin: 1, errorCorrectionLevel: "M" }),
    })),
  );
  return { ...hasil, tiket };
}
