import { Breadcrumb } from "@/components/breadcrumb";
import { db } from "@/lib/db";
import { daftarAntrean, opsiAntrean } from "@/lib/antrean";
import { hariJakarta } from "@/lib/tiket";
import { PanelAntrean } from "./panel-antrean";

export const metadata = { title: "Antrean Hari Ini | SIAP PPA" };
export const dynamic = "force-dynamic";

const TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

export default async function HalamanAntrean({ searchParams }: { searchParams: Promise<{ lokasi?: string; jenis?: string; tanggal?: string }> }) {
  const q = await searchParams;
  const opsi = await opsiAntrean(db);
  const hariIni = hariJakarta(new Date());
  const lokasiId = opsi.lokasi.find((l) => l.id === q.lokasi)?.id ?? opsi.lokasi[0]?.id ?? "";
  const jenisId = opsi.jenis.find((j) => j.id === q.jenis)?.id ?? opsi.jenis[0]?.id ?? "";
  const tanggal = q.tanggal && TANGGAL.test(q.tanggal) ? q.tanggal : hariIni;
  const data = lokasiId && jenisId ? await daftarAntrean(db, { lokasiId, jenisPendampingId: jenisId, tanggal }) : null;

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Antrean hari ini" }]} />
      <PanelAntrean opsi={opsi} lokasiId={lokasiId} jenisId={jenisId} tanggal={tanggal} hariIni={hariIni} data={data} />
    </main>
  );
}
