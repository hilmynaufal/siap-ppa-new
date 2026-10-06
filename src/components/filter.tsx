import { Check, ChevronDown, Filter, RotateCcw } from "lucide-react";

export type PilihanChip<T extends string> = { nilai: T; label: string; jumlah?: number };

/** Filter berupa chip pilihan tunggal (mis. status); dibaca pembaca layar sebagai kelompok tombol. */
export function FilterChip<T extends string>({
  label,
  pilihan,
  nilai,
  onUbah,
}: {
  label: string;
  pilihan: PilihanChip<T>[];
  nilai: T;
  onUbah: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[13px] font-semibold text-ink-soft">{label}</span>
      {pilihan.map((p) => {
        const aktif = p.nilai === nilai;
        return (
          <button
            key={p.nilai}
            type="button"
            aria-pressed={aktif}
            onClick={() => onUbah(p.nilai)}
            className={
              "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 " +
              (aktif
                ? "border-blue-600 bg-blue-50 text-navy-800"
                : "border-line-strong bg-surface text-ink-soft hover:bg-blue-50")
            }
          >
            {aktif && <Check size={14} strokeWidth={3} aria-hidden="true" />}
            {p.label}
            {p.jumlah !== undefined && (
              <span className={"rounded-md px-1.5 text-[11px] tabular-nums " + (aktif ? "bg-blue-100" : "bg-line-soft")}>
                {p.jumlah}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Filter berupa daftar pilihan (select bawaan peramban agar mudah dipakai di ponsel dan tablet). */
export function FilterPilihan({
  id,
  label,
  semua,
  pilihan,
  nilai,
  onUbah,
  besar = false,
}: {
  id: string;
  label: string;
  /** Teks untuk pilihan "tanpa filter". */
  semua: string;
  pilihan: string[];
  nilai: string;
  onUbah: (v: string) => void;
  /** Ukuran sentuh untuk halaman Pelapor (mobile). */
  besar?: boolean;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Filter size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
      <select
        id={id}
        value={nilai}
        onChange={(e) => onUbah(e.target.value)}
        className={(besar ? "h-12 text-base " : "h-10 text-sm ") + "w-full min-w-[10.5rem] appearance-none rounded-xl border border-line-strong bg-surface pl-10 pr-10 font-medium text-ink focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"}
      >
        <option value="">{semua}</option>
        {pilihan.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
    </div>
  );
}

export function TombolAturUlang({ onKlik }: { onKlik: () => void }) {
  return (
    <button
      type="button"
      onClick={onKlik}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-bold text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
    >
      <RotateCcw size={14} aria-hidden="true" />
      Atur ulang
    </button>
  );
}
