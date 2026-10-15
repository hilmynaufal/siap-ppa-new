import { KepalaPelapor } from "@/components/kepala-pelapor";
import { db } from "@/lib/db";
import { kontakAktifPublik } from "@/lib/kontak-darurat";
import { tautanWaDarurat } from "@/lib/whatsapp";
import { DaftarPublik } from "./daftar-publik";

export const metadata = { title: "Kontak Darurat | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function HalamanKontakDarurat() {
  const kontak = await kontakAktifPublik(db);
  const kecamatan = [...new Set(kontak.map((k) => k.kecamatan).filter((n): n is string => !!n))].sort();

  return (
    <div className="min-h-screen bg-surface">
      <KepalaPelapor judul="Kontak Darurat" kembaliHref="/" telepon={kontak[0]?.telepon} whatsapp={tautanWaDarurat(kontak[0]?.telepon)} />
      <main className="mx-auto max-w-md">
        <DaftarPublik kontak={kontak} kecamatan={kecamatan} />
      </main>
    </div>
  );
}
