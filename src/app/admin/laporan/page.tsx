import { Breadcrumb } from "@/components/breadcrumb";
import { db } from "@/lib/db";
import { daftarLaporanAdmin } from "@/lib/verifikasi";
import { DaftarLaporan } from "./daftar-laporan";

export const metadata = { title: "Laporan Masuk | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function HalamanLaporan() {
  const [laporan, jenis, kecamatan] = await Promise.all([
    daftarLaporanAdmin(db),
    db.jenisKekerasan.findMany({ orderBy: { nama: "asc" }, select: { nama: true } }),
    db.kecamatan.findMany({ orderBy: { nama: "asc" }, select: { nama: true } }),
  ]);
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Laporan masuk" }]} />
      <DaftarLaporan laporan={laporan} jenis={jenis.map((j) => j.nama)} kecamatan={kecamatan.map((k) => k.nama)} />
    </main>
  );
}
