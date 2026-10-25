import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { bacaPeriode, statistikKasus } from "@/lib/statistik";
import { statistikXlsx } from "@/lib/statistik-ekspor";

/** Mengunduh laporan statistik satu periode sebagai Excel. Hanya Admin; tiap unduhan tercatat di audit. */
export async function GET(req: Request) {
  const admin = await wajibPeran("ADMIN");
  const q = new URL(req.url).searchParams;
  const periode = bacaPeriode({ tahun: q.get("tahun"), bulan: q.get("bulan") });
  const s = await statistikKasus(db, periode);
  const dibuat = new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" });
  const berkas = statistikXlsx(s, dibuat);
  await db.logAudit.create({
    data: { penggunaId: admin.id, aksi: "EKSPOR_STATISTIK", entitas: "Statistik", entitasId: periode.kunci, rincian: { periode: periode.label, total: s.total } },
  });
  return new Response(new Uint8Array(berkas), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="statistik-siap-ppa-${periode.kunci}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
