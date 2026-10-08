import { HeartHandshake } from "lucide-react";
import { IkonKotak } from "@/components/ikon-kotak";
import { KepalaPelapor } from "@/components/kepala-pelapor";
import { db } from "@/lib/db";
import { pilihanDesa } from "@/lib/desa";
import { kontakDaruratAktif } from "@/lib/kontak-darurat";
import { pilihanReferensi } from "@/lib/referensi";
import { FormLaporan } from "./form-laporan";

export const metadata = { title: "Buat Laporan | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function HalamanLapor() {
  const [jenis, kecamatan, kontak, desa, hubungan, pekerjaan] = await Promise.all([
    db.jenisKekerasan.findMany({ where: { aktif: true }, orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
    db.kecamatan.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
    kontakDaruratAktif(db, 1),
    pilihanDesa(db),
    pilihanReferensi(db, "hubungan"),
    pilihanReferensi(db, "pekerjaan"),
  ]);

  return (
    <div className="min-h-screen bg-surface">
      <KepalaPelapor judul="Buat Laporan" kembaliHref="/" telepon={kontak[0]?.telepon} />
      <main className="mx-auto max-w-md">
        {jenis.length === 0 ? (
          <div className="m-4 flex items-start gap-4 rounded-2xl border border-line bg-canvas p-5">
            <IkonKotak ikon={HeartHandshake} warna="coral" ukuran="md" />
            <div>
              <h1 className="text-lg font-bold text-navy-900">Formulir sedang disiapkan</h1>
              <p className="mt-1 text-ink-soft">
                Pilihan jenis kekerasan belum tersedia. Silakan coba lagi nanti, atau hubungi kontak darurat bila Anda membutuhkan bantuan segera.
              </p>
            </div>
          </div>
        ) : (
          <FormLaporan jenis={jenis} kecamatan={kecamatan} desa={desa} hubungan={hubungan} pekerjaan={pekerjaan} />
        )}
      </main>
    </div>
  );
}
