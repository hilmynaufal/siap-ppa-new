import { Search, X } from "lucide-react";

/** Kotak pencarian: ikon kaca pembesar, tombol hapus isian, dan label untuk pembaca layar. */
export function BilahCari({
  nilai,
  onUbah,
  placeholder,
  label = "Cari",
  besar = false,
}: {
  nilai: string;
  onUbah: (v: string) => void;
  placeholder: string;
  label?: string;
  /** Ukuran sentuh untuk halaman Pelapor (mobile): tinggi 48 px dan teks 16 px. */
  besar?: boolean;
}) {
  return (
    <div role="search" className="relative min-w-[14rem] flex-1">
      <label htmlFor="bilah-cari" className="sr-only">
        {label}
      </label>
      <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
      <input
        id="bilah-cari"
        type="text"
        value={nilai}
        onChange={(e) => onUbah(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={(besar ? "h-12 text-base " : "h-10 text-sm ") + "w-full rounded-xl border border-line-strong bg-surface pl-10 pr-10 text-ink placeholder:text-ink-mute focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"}
      />
      {nilai && (
        <button
          type="button"
          onClick={() => onUbah("")}
          aria-label="Hapus pencarian"
          className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
