import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HalamanLengkapiBap } from "@/components/halaman-lengkapi-bap";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Lengkapi Data BAP | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function Halaman({ params }: { params: Promise<{ id: string }> }) {
  const pengguna = await wajibPeran("PENDAMPING");
  const { id } = await params;
  // Hanya sesi milik Pendamping ini yang tidak dibatalkan; selain itu 404.
  const s = await db.sesi.findFirst({ where: { id, pendampingId: pengguna.id, status: { not: "DIBATALKAN" } }, select: { laporanId: true } });
  if (!s) notFound();
  return (
    <main className="mx-auto max-w-5xl px-4 pt-6 md:px-8 md:pt-8">
      <Link href={`/pendamping/sesi/${id}`} className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-brand-700 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100">
        <ArrowLeft size={16} aria-hidden="true" />
        Kembali ke ringkasan kasus
      </Link>
      <HalamanLengkapiBap db={db} laporanId={s.laporanId} kembali={{ href: `/pendamping/sesi/${id}`, label: "Kembali" }} />
    </main>
  );
}
