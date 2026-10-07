import { KepalaPelapor } from "@/components/kepala-pelapor";
import { db } from "@/lib/db";
import { kontakDaruratAktif } from "@/lib/kontak-darurat";
import { CekTiket } from "./cek-tiket";

export const metadata = { title: "Cek Tiket | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function HalamanCekTiket() {
  const kontak = await kontakDaruratAktif(db, 1);
  return (
    <div className="min-h-screen bg-surface print:bg-white">
      <div className="print:hidden">
        <KepalaPelapor judul="Cek Tiket" kembaliHref="/" telepon={kontak[0]?.telepon} />
      </div>
      <main className="mx-auto max-w-md">
        <CekTiket />
      </main>
    </div>
  );
}
