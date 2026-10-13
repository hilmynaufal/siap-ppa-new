import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { eksporLaporanXlsx } from "@/lib/ekspor-laporan";

/** Mengunduh laporan (sesuai filter di daftar) sebagai Excel. Hanya Admin; tiap unduhan tercatat di audit. */
export async function GET(req: Request) {
  const admin = await wajibPeran("ADMIN");
  const q = new URL(req.url).searchParams;
  const filter = {
    status: q.get("status") ?? undefined,
    jenis: q.get("jenis") ?? undefined,
    kecamatan: q.get("kecamatan") ?? undefined,
    dari: q.get("dari") ?? undefined,
    sampai: q.get("sampai") ?? undefined,
  };
  const { jumlah, berkas } = await eksporLaporanXlsx(db, filter);
  await db.logAudit.create({
    data: { penggunaId: admin.id, aksi: "EKSPOR_LAPORAN", entitas: "Laporan", entitasId: "semua", rincian: { jumlah, ...filter } },
  });
  const tanggal = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  return new Response(new Uint8Array(berkas), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="laporan-siap-ppa-${tanggal}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
