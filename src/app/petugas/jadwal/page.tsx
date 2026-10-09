import { CalendarClock, Info } from "lucide-react";
import { IkonKotak } from "@/components/ikon-kotak";
import { LencanaStatus, type NadaLencana } from "@/components/lencana-status";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { jadwalHariIni, type BarisJadwalHariIni } from "@/lib/antrean";
import { hariJakarta } from "@/lib/tiket";

export const metadata = { title: "Jadwal Hari Ini | SIAP PPA" };
export const dynamic = "force-dynamic";

const STATUS_SESI: Record<BarisJadwalHariIni["statusSesi"], { label: string; nada: NadaLencana }> = {
  TERJADWAL: { label: "Terjadwal", nada: "info" },
  BERLANGSUNG: { label: "Berlangsung", nada: "peringatan" },
  SELESAI: { label: "Selesai", nada: "sukses" },
  TIDAK_HADIR: { label: "Tidak hadir", nada: "peringatan" },
  DIBATALKAN: { label: "Dibatalkan", nada: "galat" },
};

/** Jadwal sesi hari ini di lokasi tugas Petugas. Hanya nomor antrean, jam, jenis, dan Pendamping; tanpa data korban. */
export default async function HalamanJadwalPetugas() {
  const pengguna = await wajibPeran("PETUGAS");
  const hariIni = hariJakarta(new Date());
  const baris = pengguna.lokasiId ? await jadwalHariIni(db, pengguna.lokasiId, hariIni) : [];
  const tanggal = new Date(`${hariIni}T00:00:00+07:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-center gap-4">
        <IkonKotak ikon={CalendarClock} warna="teal" ukuran="lg" />
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Jadwal Hari Ini</h1>
          <p className="mt-0.5 text-sm text-ink-soft">{tanggal}</p>
        </div>
      </div>
      <p className="mb-6 flex items-start gap-3 rounded-2xl bg-info-50 p-4 text-sm font-medium text-info">
        <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
        Identitas korban dan pelapor tidak ditampilkan. Pelapor menunjukkan QR tiket untuk check-in di halaman Antrean.
      </p>
      <section aria-labelledby="h-jadwal" className="rounded-2xl border border-line bg-surface shadow-card">
        <h2 id="h-jadwal" className="border-b border-line-soft p-5 text-lg font-bold text-navy-900">
          Sesi di lokasi Anda ({baris.length})
        </h2>
        {baris.length === 0 ? (
          <p className="p-6 text-ink-soft">Tidak ada sesi terjadwal hari ini di lokasi Anda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left">
              <thead className="bg-blue-50/60 text-sm font-bold text-ink-soft">
                <tr>
                  <th scope="col" className="px-5 py-3">Jam</th>
                  <th scope="col" className="px-3 py-3">No. antrean</th>
                  <th scope="col" className="px-3 py-3">Layanan</th>
                  <th scope="col" className="px-3 py-3">Pendamping</th>
                  <th scope="col" className="px-3 py-3">Check-in</th>
                  <th scope="col" className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {baris.map((b) => (
                  <tr key={b.nomorAntrean + b.jam}>
                    <td className="px-5 py-3 tabular-nums">{b.jam}</td>
                    <td className="px-3 py-3 tabular-nums font-semibold text-navy-900">{b.nomorAntrean}</td>
                    <td className="px-3 py-3">{b.jenis}</td>
                    <td className="px-3 py-3">{b.pendamping}</td>
                    <td className="px-3 py-3 tabular-nums text-ink-soft">{b.checkIn ?? "Belum check-in"}</td>
                    <td className="px-3 py-3">
                      <LencanaStatus nada={STATUS_SESI[b.statusSesi].nada}>{STATUS_SESI[b.statusSesi].label}</LencanaStatus>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
