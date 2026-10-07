import { readFile } from "node:fs/promises";
import path from "node:path";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { direktoriUnggah } from "@/lib/laporan-layanan";

/** Berkas bukti hanya dilayani lewat sini (di luar akar web) dan hanya untuk Admin. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; dokId: string }> }) {
  await wajibPeran("ADMIN");
  const { id, dokId } = await params;
  const dok = await db.dokumenLaporan.findFirst({ where: { id: dokId, laporanId: id } });
  if (!dok) return new Response("Berkas tidak ditemukan.", { status: 404 });

  const dir = direktoriUnggah();
  const jalur = path.resolve(/* turbopackIgnore: true */ dir, dok.jalurBerkas);
  // Jaga agar jalur tersimpan tidak pernah keluar dari direktori unggahan.
  if (!jalur.startsWith(dir + path.sep)) return new Response("Berkas tidak ditemukan.", { status: 404 });

  let isi: Buffer;
  try {
    isi = await readFile(jalur);
  } catch {
    return new Response("Berkas tidak ditemukan.", { status: 404 });
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
