import { Breadcrumb } from "@/components/breadcrumb";
import { db } from "@/lib/db";
import { daftarJadwalAdmin } from "@/lib/jadwal";
import { DaftarJadwal } from "./daftar-jadwal";

export const metadata = { title: "Jadwal Pendampingan | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function HalamanJadwal() {
  const [sesi, pendamping] = await Promise.all([
    daftarJadwalAdmin(db),
    db.pengguna.findMany({
      where: { peran: "PENDAMPING", aktif: true },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, jenisPendampingId: true },
    }),
  ]);
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Jadwal pendampingan" }]} />
      <DaftarJadwal sesi={sesi} pendamping={pendamping} />
    </main>
  );
}
