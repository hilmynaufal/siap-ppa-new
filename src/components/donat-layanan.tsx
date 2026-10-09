import type { IrisanDonat } from "@/lib/dasbor";

const PALET = ["#7A4FD6", "#0E9F8E", "#F5B014", "#1E9BE0", "#F26A4B", "#B81B68"];

/**
 * Donat jenis layanan (SVG murni). Setiap irisan disertai nama, jumlah, dan persen pada daftar di sampingnya,
 * sehingga warna bukan satu-satunya penanda.
 */
export function DonatLayanan({ data, total, satuan = "layanan" }: { data: IrisanDonat[]; total: number; satuan?: string }) {
  if (total === 0) {
    return <p className="rounded-xl border border-dashed border-line-strong p-4 text-sm text-ink-soft">Belum ada {satuan} pada periode ini.</p>;
  }
  const R = 70;
  const KELILING = 2 * Math.PI * R;
  // Posisi awal tiap irisan dihitung dulu agar render tidak mengubah variabel luar.
  const awal = data.map((_, i) => (data.slice(0, i).reduce((jml, d) => jml + d.jumlah, 0) / total) * KELILING);
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 200 200" width="170" height="170" role="img" aria-label={`Donat jenis layanan, total ${total} ${satuan}`} className="shrink-0">
        <circle cx="100" cy="100" r={R} fill="none" stroke="#E8EEFB" strokeWidth="30" />
        {data.map((d, i) => {
          const panjang = (d.jumlah / total) * KELILING;
          return (
            <circle
              key={d.nama}
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke={PALET[i % PALET.length]}
              strokeWidth="30"
              strokeDasharray={`${panjang} ${KELILING - panjang}`}
              strokeDashoffset={-awal[i]}
              transform="rotate(-90 100 100)"
            >
              <title>{`${d.nama}: ${d.jumlah}`}</title>
            </circle>
          );
        })}
        <text x="100" y="104" textAnchor="middle" fontSize="34" fontWeight="800" fill="#0F2A63">
          {total}
        </text>
        <text x="100" y="124" textAnchor="middle" fontSize="12" fill="#5B6682">
          {satuan}
        </text>
      </svg>
      <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
        {data.map((d, i) => (
          <li key={d.nama} className="flex items-start gap-2.5">
            <span aria-hidden="true" className="mt-1.5 h-3 w-3 shrink-0 rounded-sm" style={{ background: PALET[i % PALET.length] }} />
            <span className="min-w-0">
              <span className="block break-words font-semibold text-ink">{d.nama}</span>
              <span className="text-sm text-ink-soft">
                {d.jumlah} {satuan} · {Math.round((d.jumlah / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
