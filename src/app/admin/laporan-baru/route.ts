import { wajibPeran } from "@/lib/auth";
import { statusLaporanBaru } from "@/lib/dasbor";
import { db } from "@/lib/db";

/** Dipanggil berkala oleh browser Admin untuk notifikasi laporan baru. Hanya jumlah dan waktu, tanpa data laporan. */
export async function GET() {
  await wajibPeran("ADMIN");
  return Response.json(await statusLaporanBaru(db), { headers: { "Cache-Control": "private, no-store" } });
}
