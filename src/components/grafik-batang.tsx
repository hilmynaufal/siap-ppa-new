import type { TitikGrafik } from "@/lib/dasbor";

const SERI = [
  { kunci: "baru", label: "Baru", warna: "#2F6FED" },
  { kunci: "terverifikasi", label: "Terverifikasi", warna: "#1E9E5A" },
  { kunci: "ditolak", label: "Ditolak", warna: "#B42318" },
] as const;

/** Batas atas sumbu: empat selang sama besar dengan langkah yang rapi (1, 2, 5, 10, ...), agar garis bantu jatuh pada angka bulat. */
export function batasAtas(maks: number) {
  const langkah = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000].find((l) => l * 4 >= maks) ?? Math.ceil(maks / 4 / 1000) * 1000;
  return langkah * 4;
}

const W = 720;
const H = 290;
const KIRI = 40;
const ATAS = 16;
const BAWAH = 34;

/**
 * Grafik batang berkelompok (SVG murni, tanpa pustaka): laporan per status per bulan.
 * Angka tampil di atas batang dan tersedia juga sebagai tabel bagi pembaca layar, jadi warna bukan satu-satunya penanda.
 */
export function GrafikBatang({ data }: { data: TitikGrafik[] }) {
  const maks = Math.max(0, ...data.flatMap((d) => [d.baru, d.terverifikasi, d.ditolak]));
  const atas = batasAtas(maks);
  const tinggi = H - ATAS - BAWAH;
  const lebarGrup = (W - KIRI - 8) / data.length;
  const lebarBatang = Math.min(22, (lebarGrup - 16) / 3);
  const y = (n: number) => ATAS + tinggi - (n / atas) * tinggi;
  const garis = [0, 1, 2, 3, 4].map((i) => (atas / 4) * i);

  return (
    <figure className="m-0">
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft" aria-label="Keterangan warna">
        {SERI.map((s) => (
          <li key={s.kunci} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ background: s.warna }} />
            {s.label}
          </li>
        ))}
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Grafik batang laporan per status, ${data.length} bulan terakhir`} className="block">
        {garis.map((n) => (
          <g key={n}>
            <line x1={KIRI} x2={W - 8} y1={y(n)} y2={y(n)} stroke="#E8EEFB" strokeWidth="1" />
            <text x={KIRI - 8} y={y(n) + 4} textAnchor="end" fontSize="11" fill="#5B6682">
              {n}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x0 = KIRI + i * lebarGrup + (lebarGrup - lebarBatang * 3 - 4) / 2;
          return (
            <g key={d.bulan}>
              {SERI.map((s, j) => {
                const n = d[s.kunci];
                const x = x0 + j * (lebarBatang + 2);
                return (
                  <g key={s.kunci}>
                    <rect x={x} y={y(n)} width={lebarBatang} height={Math.max(n > 0 ? 2 : 0, ATAS + tinggi - y(n))} rx="3" fill={s.warna}>
                      <title>{`${d.label}: ${s.label} ${n}`}</title>
                    </rect>
                    {n > 0 && (
                      <text x={x + lebarBatang / 2} y={y(n) - 4} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#1B2540">
                        {n}
                      </text>
                    )}
                  </g>
                );
              })}
              <text x={KIRI + i * lebarGrup + lebarGrup / 2} y={H - 12} textAnchor="middle" fontSize="12" fontWeight={i === data.length - 1 ? 700 : 500} fill="#1B2540">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>Laporan per status per bulan</caption>
        <thead>
          <tr>
            <th scope="col">Bulan</th>
            {SERI.map((s) => (
              <th key={s.kunci} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.bulan}>
              <th scope="row">{d.bulan}</th>
              {SERI.map((s) => (
                <td key={s.kunci}>{d[s.kunci]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
