import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { daftarAntrean, opsiAntrean } from "@/lib/antrean";
import { hariJakarta } from "@/lib/tiket";
import { PanelAntrean } from "../admin/antrean/panel-antrean";
import { checkInAksi, lewatiAksi, panggilAksi } from "./actions";

export const metadata = { title: "Antrean Hari Ini | SIAP PPA" };
export const dynamic = "force-dynamic";

/** Antrean hari ini di lokasi tugas Petugas. Lokasi dan tanggal tidak dapat diganti. */
export default async function HalamanAntreanPetugas({ searchParams }: { searchParams: Promise<{ jenis?: string }> }) {
  const pengguna = await wajibPeran("PETUGAS");
  const q = await searchParams;
  if (!pengguna.lokasiId) {
    return (
      <main className="px-4 py-6 md:px-8 md:py-8">
        <p role="alert" className="rounded-2xl border border-line bg-surface p-6 font-semibold text-error">
          Akun Anda belum terikat pada lokasi tugas. Hubungi Admin.
        </p>
      </main>
    );
  }
  const semua = await opsiAntrean(db);
  const lokasi = semua.lokasi.filter((l) => l.id === pengguna.lokasiId);
  const hariIni = hariJakarta(new Date());
  const jenisId = semua.jenis.find((j) => j.id === q.jenis)?.id ?? semua.jenis[0]?.id ?? "";
  const data = lokasi.length && jenisId ? await daftarAntrean(db, { lokasiId: pengguna.lokasiId, jenisPendampingId: jenisId, tanggal: hariIni }) : null;

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <PanelAntrean
        aksi={{ checkIn: checkInAksi, panggil: panggilAksi, lewati: lewatiAksi }}
        basePath="/petugas"
        kunciLokasi
        kunciTanggal
        opsi={{ lokasi: lokasi.length ? lokasi : [], jenis: semua.jenis }}
        lokasiId={lokasi.length ? pengguna.lokasiId : ""}
        jenisId={jenisId}
        tanggal={hariIni}
        hariIni={hariIni}
        data={data}
      />
    </main>
  );
}
