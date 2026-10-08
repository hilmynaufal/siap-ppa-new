import { readFile } from "node:fs/promises";
import path from "node:path";
import { penggunaSaatIni } from "@/lib/auth";
import { db } from "@/lib/db";
import { direktoriUnggah } from "@/lib/laporan-layanan";
import { fotoUntukPengguna } from "@/lib/laporan-pendampingan";

/**
 * Foto laporan pendampingan dilayani lewat sini (di luar akar web). Hanya Admin atau Pendamping yang memegang
 * sesi pada kasus yang sama; selain itu 404 agar keberadaan berkas tidak bocor.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const pengguna = await penggunaSaatIni();
  if (!pengguna) return new Response("Berkas tidak ditemukan.", { status: 404 });
  const { id } = await params;
  const foto = await fotoUntukPengguna(db, id, pengguna);
  if (!foto) return new Response("Berkas tidak ditemukan.", { status: 404 });

  const dir = direktoriUnggah();
  const jalur = path.resolve(/* turbopackIgnore: true */ dir, foto.jalurBerkas);
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
      "Content-Type": foto.tipeMime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(foto.namaBerkas)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
