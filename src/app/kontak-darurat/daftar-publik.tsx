"use client";

import { MapPin, Phone, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { BilahCari } from "@/components/bilah-cari";
import { FilterPilihan } from "@/components/filter";

type Kontak = { id: string; instansi: string; telepon: string; alamat: string; kecamatan: string | null };

const TINGKAT_KABUPATEN = "Tingkat kabupaten";

export function DaftarPublik({ kontak, kecamatan }: { kontak: Kontak[]; kecamatan: string[] }) {
  const [cari, setCari] = useState("");
  const [wilayah, setWilayah] = useState("");

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return kontak.filter(
      (k) =>
        (!wilayah || (wilayah === TINGKAT_KABUPATEN ? k.kecamatan === null : k.kecamatan === wilayah)) &&
        (!q || k.instansi.toLowerCase().includes(q)),
    );
  }, [kontak, cari, wilayah]);

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-line-soft bg-surface px-4 pb-4 pt-4">
        <BilahCari besar nilai={cari} onUbah={setCari} placeholder="Cari nama instansi" label="Cari nama instansi" />
        <FilterPilihan besar id="filter-wilayah" label="Filter kecamatan" semua="Semua kecamatan" pilihan={[TINGKAT_KABUPATEN, ...kecamatan]} nilai={wilayah} onUbah={setWilayah} />
      </div>

      <div className="bg-canvas px-4 pb-10 pt-4">
        <p className="mb-4 text-sm text-ink-soft" aria-live="polite">
          {tampil.length} kontak{kontak.length !== tampil.length ? ` dari ${kontak.length}` : ""} · UPTD PPA dan Satgas PPA kecamatan
        </p>

        {tampil.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-6 text-center text-ink-soft">
            <SearchX size={36} aria-hidden="true" className="mx-auto mb-3 text-line-strong" />
            Tidak ada kontak yang cocok. Coba kata lain atau pilih semua kecamatan.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {tampil.map((k) => (
              <li key={k.id} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-teal-700">
                    {k.kecamatan ? `Kec. ${k.kecamatan}` : TINGKAT_KABUPATEN}
                  </p>
                  <p className="mt-0.5 font-bold text-navy-900">{k.instansi}</p>
                  <p className="mt-1 flex items-start gap-2 text-sm text-ink-soft">
                    <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute" />
                    {k.alamat}
                  </p>
                  <p className="mt-1 font-bold tabular-nums text-ink">{k.telepon}</p>
                </div>
                <a
                  href={`tel:${k.telepon.replace(/[^\d+]/g, "")}`}
                  aria-label={`Telepon ${k.instansi}`}
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-blue-50 text-navy-800 transition-colors hover:bg-blue-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                >
                  <Phone size={24} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
