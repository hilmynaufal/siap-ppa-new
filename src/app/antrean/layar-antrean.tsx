"use client";

import { useEffect, useState } from "react";
import type { LayarPublik } from "@/lib/antrean";

const SEGAR_MS = 5000;
const jam = (d: Date) => d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ".");
const tanggal = (d: Date) => d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

/** Layar TV lobi: nomor yang dipanggil dan tiga nomor berikutnya, disegarkan otomatis. Tanpa nama. */
export function LayarAntrean({ lokasiId, jenisId, awal }: { lokasiId: string; jenisId: string; awal: LayarPublik }) {
  const [data, setData] = useState(awal);
  const [sekarang, setSekarang] = useState<Date | null>(null);

  useEffect(() => {
    let batal = false;
    const ambil = async () => {
      try {
        const r = await fetch(`/antrean/data?lokasi=${encodeURIComponent(lokasiId)}&jenis=${encodeURIComponent(jenisId)}`, { cache: "no-store" });
        if (r.ok && !batal) setData(await r.json());
      } catch {
        /* jaringan putus sebentar; tampilan terakhir dipertahankan */
      }
      if (!batal) setSekarang(new Date());
    };
    const a = setInterval(ambil, SEGAR_MS);
    const t = setTimeout(() => setSekarang(new Date()), 0);
    return () => {
      batal = true;
      clearInterval(a);
      clearTimeout(t);
    };
  }, [lokasiId, jenisId]);

  return (
    <main className="flex min-h-screen flex-col bg-navy-900 text-white" aria-live="polite">
      <header className="flex items-center justify-between gap-6 border-b border-white/10 px-[4vw] py-[2vh]">
        <div>
          <h1 className="text-[3.2vw] font-extrabold leading-tight">{data.jenis}</h1>
          <p className="text-[1.6vw] text-white/80">{data.lokasi}</p>
        </div>
        <div className="text-right">
          <p className="text-[3.2vw] font-extrabold tabular-nums leading-tight">{sekarang ? jam(sekarang) : "--.--"}</p>
          <p className="text-[1.6vw] text-white/80">{sekarang ? tanggal(sekarang) : ""}</p>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[1.6fr_1fr]">
        <section aria-label="Nomor dipanggil" className="flex flex-col justify-center px-[4vw]">
          <p className="text-[2.6vw] font-bold text-white/80">Nomor dipanggil</p>
          {data.dipanggil ? (
            <>
              <p className="flex items-baseline gap-[2vw] font-extrabold leading-none" data-testid="nomor-dipanggil">
                <span className="text-[9vw] text-blue-100">{data.dipanggil.awalan}</span>
                <span className="text-[19vw] tabular-nums">{data.dipanggil.urutan}</span>
              </p>
              <p className="mt-[2vh] text-[2.6vw] font-bold">Silakan menuju meja petugas</p>
            </>
          ) : (
            <p className="mt-[4vh] text-[5vw] font-extrabold" data-testid="nomor-dipanggil">
              Belum ada nomor dipanggil
            </p>
          )}
        </section>
        <section aria-label="Nomor berikutnya" className="bg-white/5 px-[3vw] py-[4vh]">
          <h2 className="mb-[3vh] text-[2.4vw] font-bold text-white/80">Berikutnya</h2>
          <ul className="flex flex-col gap-[2.4vh]">
            {data.berikutnya.map((b) => (
              <li key={b.nomor} className="flex items-baseline gap-[1.6vw] rounded-2xl bg-white/5 px-[2vw] py-[2vh] font-extrabold" data-testid="nomor-berikutnya">
                <span className="text-[3vw] text-blue-100">{b.awalan}</span>
                <span className="text-[6vw] tabular-nums leading-none">{b.urutan}</span>
              </li>
            ))}
            {data.berikutnya.length === 0 && <li className="text-[2.2vw] text-white/70">Belum ada nomor menunggu</li>}
          </ul>
        </section>
      </div>

      <footer className="bg-magenta-600 px-[4vw] py-[3vh] text-[2.4vw] font-bold">Tunjukkan QR tiket kepada petugas saat nomor Anda dipanggil.</footer>
    </main>
  );
}
