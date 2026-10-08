import { db } from "@/lib/db";
import { layarPublik } from "@/lib/antrean";

/** Data layar antrean publik: hanya nomor, tanpa nama atau data kasus. Dibaca berkala oleh layar TV. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const data = await layarPublik(db, (u.searchParams.get("lokasi") ?? "").slice(0, 60), (u.searchParams.get("jenis") ?? "").slice(0, 60));
  if (!data) return Response.json({ galat: "Layar tidak ditemukan." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
