import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { HalamanLengkapiBap } from "@/components/halaman-lengkapi-bap";
import { db } from "@/lib/db";

export const metadata = { title: "Lengkapi Data BAP | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function Halaman({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await db.laporan.findUnique({ where: { id }, select: { kodePendaftaran: true } });
  if (!l) notFound();
  return (
    <main className="px-4 pt-6 md:px-8 md:pt-8">
      <Breadcrumb
        remah={[
          { label: "Beranda", href: "/admin" },
          { label: "Laporan masuk", href: "/admin/laporan" },
          { label: l.kodePendaftaran, href: `/admin/laporan/${id}` },
          { label: "Lengkapi data BAP" },
        ]}
      />
      <HalamanLengkapiBap db={db} laporanId={id} kembali={{ href: `/admin/laporan/${id}`, label: "Kembali" }} />
    </main>
  );
}
