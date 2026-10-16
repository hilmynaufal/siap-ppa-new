import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PrismaClient } from "@/generated/prisma/client";
import { direktoriUnggah } from "./laporan-layanan";

const tidakAda = () => new Response("Berkas tidak ditemukan.", { status: 404 });

/**
 * Melayani satu dokumen pendukung laporan dari direktori unggahan (di luar akar web).
 * Pemeriksaan hak akses dilakukan pemanggil; di sini hanya memastikan dokumen milik laporan itu
 * dan jalurnya tidak keluar dari direktori unggahan.
 */
export async function responsDokumen(db: PrismaClient, laporanId: string, dokId: string): Promise<Response> {
  const dok = await db.dokumenLaporan.findFirst({ where: { id: dokId, laporanId } });
  if (!dok) return tidakAda();

  const dir = direktoriUnggah();
  const jalur = path.resolve(/* turbopackIgnore: true */ dir, dok.jalurBerkas);
  if (!jalur.startsWith(dir + path.sep)) return tidakAda();

  let isi: Buffer;
  try {
    isi = await readFile(jalur);
  } catch {
    return tidakAda();
  }
  return new Response(new Uint8Array(isi), {
    headers: {
      "Content-Type": dok.tipeMime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(dok.namaBerkas)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
