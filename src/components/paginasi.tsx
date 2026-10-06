import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const UKURAN_HALAMAN = [10, 25, 50];

/** Nomor halaman yang ditampilkan: selalu halaman pertama dan terakhir, jendela di sekitar halaman aktif, sisanya "...". */
export function nomorHalaman(aktif: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, aktif - 1, aktif, aktif + 1]);
  if (aktif <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (aktif >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => set.add(n));
  const urut = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const hasil: (number | "...")[] = [];
  urut.forEach((n, i) => {
    if (i > 0 && n - urut[i - 1] > 1) hasil.push("...");
    hasil.push(n);
  });
  return hasil;
}

const tombol =
  "grid h-10 min-w-10 place-items-center rounded-xl px-2 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100";

export function Paginasi({
  halaman,
  ukuran,
  total,
  onHalaman,
  onUkuran,
  satuan = "jenis",
}: {
  halaman: number;
  ukuran: number;
  total: number;
  onHalaman: (h: number) => void;
  onUkuran: (u: number) => void;
  /** Kata benda untuk ringkasan, mis. "jenis" atau "kontak". */
  satuan?: string;
}) {
  const jumlahHalaman = Math.max(1, Math.ceil(total / ukuran));
  const dari = total === 0 ? 0 : (halaman - 1) * ukuran + 1;
  const sampai = Math.min(halaman * ukuran, total);
  const pertama = halaman <= 1;
  const terakhir = halaman >= jumlahHalaman;

  const navigasi = (label: string, tujuan: number, mati: boolean, Ikon: typeof ChevronLeft) => (
    <button
      type="button"
      aria-label={label}
      disabled={mati}
      onClick={() => onHalaman(tujuan)}
      className={`${tombol} border border-line-strong bg-surface text-ink hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-line-soft disabled:bg-canvas disabled:text-line-strong disabled:hover:bg-canvas`}
    >
      <Ikon size={18} aria-hidden="true" />
    </button>
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line-soft px-5 py-4">
      <div className="flex flex-wrap items-center gap-4 text-sm text-ink-soft">
        <p aria-live="polite">
          Menampilkan <strong className="text-ink">{dari}-{sampai}</strong> dari <strong className="text-ink">{total}</strong> {satuan}
        </p>
        <label className="flex items-center gap-2">
          Baris per halaman
          <select
            value={ukuran}
            onChange={(e) => onUkuran(Number(e.target.value))}
            className="h-10 rounded-xl border border-line-strong bg-surface px-3 text-sm font-bold text-ink focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            {UKURAN_HALAMAN.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav aria-label="Paginasi" className="flex items-center gap-1.5">
        {navigasi("Halaman pertama", 1, pertama, ChevronsLeft)}
        {navigasi("Halaman sebelumnya", halaman - 1, pertama, ChevronLeft)}
        <ul className="flex items-center gap-1.5">
          {nomorHalaman(halaman, jumlahHalaman).map((n, i) =>
            n === "..." ? (
              <li key={`e${i}`} aria-hidden="true" className="grid h-10 min-w-8 place-items-center text-ink-mute">
                ...
              </li>
            ) : (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => onHalaman(n)}
                  aria-label={`Halaman ${n}`}
                  aria-current={n === halaman ? "page" : undefined}
                  className={
                    tombol +
                    " tabular-nums " +
                    (n === halaman
                      ? "bg-blue-600 text-white shadow-card"
                      : "border border-transparent text-ink-soft hover:bg-blue-50")
                  }
                >
                  {n}
                </button>
              </li>
            ),
          )}
        </ul>
        {navigasi("Halaman berikutnya", halaman + 1, terakhir, ChevronRight)}
        {navigasi("Halaman terakhir", jumlahHalaman, terakhir, ChevronsRight)}
      </nav>
    </div>
  );
}
