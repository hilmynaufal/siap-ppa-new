import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IkonKotak, type WarnaIkon } from "./ikon-kotak";

export type ItemKpi = {
  label: string;
  nilai: string | number;
  /** Konteks singkat di bawah angka, boleh berisi lencana. */
  keterangan: ReactNode;
  ikon: LucideIcon;
  warna: WarnaIkon;
};

/**
 * Ringkasan angka kunci dalam satu permukaan bersekat (bukan deretan kartu identik).
 * Tiap sel: ikon berwarna sebagai penanda, label, angka, lalu konteks agar angka tidak berdiri sendiri.
 * Garis pemisah dibuat dari celah 1px di atas latar garis, sehingga rapi pada 1, 2, atau 4 kolom.
 */
export function StripKpi({ judul, item }: { judul: string; item: ItemKpi[] }) {
  return (
    <section
      aria-label={judul}
      className="mb-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line-soft shadow-card sm:grid-cols-2 xl:grid-cols-4"
    >
      {item.map((k) => (
        <div key={k.label} className="flex items-start justify-between gap-4 bg-surface p-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-soft">{k.label}</p>
            <p className="mt-0.5 text-3xl font-extrabold leading-tight text-navy-900 tabular-nums">{k.nilai}</p>
            <div className="mt-1 text-sm text-ink-mute">{k.keterangan}</div>
          </div>
          <IkonKotak ikon={k.ikon} warna={k.warna} ukuran="md" />
        </div>
      ))}
    </section>
  );
}
