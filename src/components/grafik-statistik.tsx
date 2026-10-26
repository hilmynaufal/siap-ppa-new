import type { TitikTren } from "@/lib/statistik";
import { batasAtas } from "./grafik-batang";

/** Warna kelompok usia, sama di semua grafik statistik (lolos pemeriksaan buta warna untuk dua seri). */
export const SERI_USIA = [
  { kunci: "anak", label: "Anak (<18 th)", warna: "#2a78d6" },
  { kunci: "dewasa", label: "Dewasa", warna: "#eb6834" },
  { kunci: "lain", label: "Usia tidak diketahui", warna: "#b9d0c0" },
] as const;

export type KunciSeri = (typeof SERI_USIA)[number]["kunci"];

/** Keterangan warna; seri yang seluruhnya nol tidak ditampilkan. */
export function Legenda({ seri = SERI_USIA }: { seri?: readonly { kunci: string; label: string; warna: string }[] }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft" aria-label="Keterangan warna">
      {seri.map((s) => (
        <li key={s.kunci} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ background: s.warna }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

const seriAda = (data: Partial<Record<KunciSeri, number>>[]) => SERI_USIA.filter((s) => s.kunci !== "lain" || data.some((d) => (d.lain ?? 0) > 0));

/**
 * Batang mendatar bertumpuk per kelompok usia (HTML, mengikuti lebar layar; nama panjang turun baris).
 * Jumlah total tampil di ujung batang; rincian per segmen lewat tooltip dan tabel di bawahnya.
 */
export function BatangUsia({ data, label }: { data: ({ nama: string; jumlah: number } & Record<KunciSeri, number>)[]; label: string }) {
  if (data.every((d) => d.jumlah === 0)) return <Kosong />;
  const maks = Math.max(...data.map((d) => d.jumlah));
  const seri = seriAda(data);
  return (
    <figure className="m-0">
      <Legenda seri={seri} />
      <ul className="flex flex-col gap-2.5" aria-label={label}>
        {data.map((d) => (
          <li key={d.nama} className="grid grid-cols-[minmax(7rem,11rem)_1fr] items-center gap-3 text-sm">
            <span className="break-words font-semibold text-ink">{d.nama}</span>
            <span className="flex items-center gap-2">
              <span className="flex h-4 gap-[2px]" style={{ width: `${(d.jumlah / maks) * 85}%` }} aria-hidden="true">
                {seri.map((s) =>
                  d[s.kunci] > 0 ? (
                    <span
                      key={s.kunci}
                      title={`${d.nama}, ${s.label}: ${d[s.kunci]}`}
                      className="h-full first:rounded-l-[3px] last:rounded-r-[4px]"
                      style={{ background: s.warna, flexGrow: d[s.kunci], flexBasis: 0 }}
                    />
                  ) : null,
                )}
              </span>
              <span className="shrink-0 font-bold tabular-nums text-ink">{d.jumlah}</span>
              <span className="sr-only">{seri.map((s) => `${s.label} ${d[s.kunci]}`).join(", ")}</span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Batang mendatar satu seri (mis. hubungan pelaku), dengan jumlah dan persen. */
export function BatangTunggal({ data, total, warna = "#2a78d6" }: { data: { nama: string; jumlah: number }[]; total: number; warna?: string }) {
  if (total === 0) return <Kosong />;
  const maks = Math.max(...data.map((d) => d.jumlah));
  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((d) => (
        <li key={d.nama} className="text-sm">
          <span className="flex items-baseline justify-between gap-3">
            <span className="break-words font-semibold text-ink">{d.nama}</span>
            <span className="shrink-0 tabular-nums text-ink-soft">
              <b className="text-ink">{d.jumlah}</b> · {Math.round((d.jumlah / total) * 100)}%
            </span>
          </span>
          <span aria-hidden="true" className="mt-1 block h-2 rounded-r-[4px] rounded-l-[2px]" style={{ width: `${Math.max(2, (d.jumlah / maks) * 100)}%`, background: warna }} />
        </li>
      ))}
    </ul>
  );
}

const W = 720;
const H = 260;
const KIRI = 36;
const ATAS = 18;
const BAWAH = 30;

/** Kolom bertumpuk per bulan (SVG), total di atas kolom; tabel tersembunyi untuk pembaca layar. */
export function TrenBulanan({ data, sorot }: { data: TitikTren[]; sorot?: string }) {
  const total = data.map((d) => d.anak + d.dewasa + d.lain);
  const atas = batasAtas(Math.max(0, ...total));
  const tinggi = H - ATAS - BAWAH;
  const lebarGrup = (W - KIRI - 4) / data.length;
  const lebar = Math.min(24, lebarGrup - 14);
  const y = (n: number) => ATAS + tinggi - (n / atas) * tinggi;
  const seri = seriAda(data);
  return (
    <figure className="m-0">
      <Legenda seri={seri} />
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Kolom korban per bulan, ${data[0].label} sampai ${data[data.length - 1].label}`} className="block">
        {[0, 1, 2, 3, 4].map((i) => {
          const n = (atas / 4) * i;
          return (
            <g key={i}>
              <line x1={KIRI} x2={W - 4} y1={y(n)} y2={y(n)} stroke={i === 0 ? "#b9d0c0" : "#E6F0E9"} strokeWidth="1" />
              <text x={KIRI - 8} y={y(n) + 4} textAnchor="end" fontSize="11" fill="#566A5D">
                {n}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = KIRI + i * lebarGrup + (lebarGrup - lebar) / 2;
          let dasar = 0;
          const potong = seri.map((s) => {
            const n = d[s.kunci];
            const r = { s, n, dari: dasar };
            dasar += n;
            return r;
          });
          const puncak = potong.filter((p) => p.n > 0).at(-1)?.s.kunci;
          const tebal = d.bulan === sorot;
          return (
            <g key={d.bulan}>
              {potong.map(({ s, n, dari }) => {
                if (n === 0) return null;
                // Celah 2px di antara segmen; hanya ujung teratas yang membulat.
                const y1 = y(dari + n);
                const h = Math.max(1, y(dari) - y1 - (dari > 0 ? 2 : 0));
                return (
                  <path
                    key={s.kunci}
                    d={s.kunci === puncak ? bulatAtas(x, y1, lebar, h, 4) : `M${x},${y1}h${lebar}v${h}h${-lebar}z`}
                    fill={s.warna}
                  >
                    <title>{`${d.label}: ${s.label} ${n}`}</title>
                  </path>
                );
              })}
              {total[i] > 0 && (
                <text x={x + lebar / 2} y={y(total[i]) - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1A2B22">
                  {total[i]}
                </text>
              )}
              <text x={x + lebar / 2} y={H - 10} textAnchor="middle" fontSize="11" fontWeight={tebal ? 800 : 500} fill={tebal ? "#0b3d22" : "#455a4d"}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>Korban per bulan menurut kelompok usia</caption>
        <thead>
          <tr>
            <th scope="col">Bulan</th>
            {seri.map((s) => (
              <th key={s.kunci} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.bulan}>
              <th scope="row">{d.label}</th>
              {seri.map((s) => (
                <td key={s.kunci}>{d[s.kunci]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function bulatAtas(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}z`;
}

function Kosong() {
  return <p className="rounded-xl border border-dashed border-line-strong p-4 text-sm text-ink-soft">Belum ada kasus pada periode ini.</p>;
}

export type ModeGrafik = "batang" | "garis";

/** Tampilan grafik dari parameter alamat `grafik`; bawaannya batang. */
export const bacaModeGrafik = (v: string | undefined | null): ModeGrafik => (v === "garis" ? "garis" : "batang");

/**
 * Pilihan tampilan Batang/Garis sebagai tautan (tanpa JavaScript), mempertahankan parameter lain.
 * Disembunyikan saat dicetak.
 */
export function PilihGrafik({ mode, dasar, param }: { mode: ModeGrafik; dasar: string; param: Record<string, string> }) {
  const tautan = (m: ModeGrafik) => `${dasar}?${new URLSearchParams({ ...param, grafik: m })}`;
  return (
    <div role="group" aria-label="Tampilan grafik" className="inline-flex print:hidden rounded-xl border border-line-strong bg-surface p-1 text-sm font-bold">
      {(["batang", "garis"] as const).map((m) => (
        <a
          key={m}
          href={tautan(m)}
          aria-current={mode === m ? "true" : undefined}
          className={`rounded-lg px-4 py-2 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 ${mode === m ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-brand-50"}`}
        >
          {m === "batang" ? "Batang" : "Garis"}
        </a>
      ))}
    </div>
  );
}

/**
 * Grafik garis per kategori (format laporan UPTD): satu seri jumlah korban, titik dan angka di tiap kategori.
 * Label sumbu X dimiringkan bila kategorinya banyak; di layar sempit grafik dapat digulir ke samping.
 */
export function GarisKategori({ data, label, warna = "#2a78d6" }: { data: { nama: string; jumlah: number }[]; label: string; warna?: string }) {
  if (data.length === 0 || data.every((d) => d.jumlah === 0)) return <Kosong />;
  const panjang = Math.max(...data.map((d) => d.nama.length));
  const miring = data.length > 6;
  // Kategori sedikit: label datar selebar nama terpanjang. Kategori banyak (kecamatan): rapat dan miring agar tetap terbaca saat dicetak.
  const langkah = miring ? 32 : Math.max(110, panjang * 7 + 16);
  // Label miring menjorok ke kiri; beri ruang agar label pertama tidak terpotong.
  const kiri = miring ? 64 : 36;
  const W = Math.max(640, kiri + 24 + data.length * langkah);
  const bawah = miring ? 30 + Math.min(18, panjang) * 4.6 : 34;
  const H = 230 + bawah;
  const ATAS_G = 24;
  const tinggi = H - ATAS_G - bawah;
  const atas = batasAtas(Math.max(1, ...data.map((d) => d.jumlah)));
  const lebar = (W - kiri - 24) / data.length;
  const x = (i: number) => kiri + 12 + lebar * i + lebar / 2;
  const y = (n: number) => ATAS_G + tinggi - (n / atas) * tinggi;
  const garis = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.jumlah)}`).join("");
  return (
    <figure className="m-0 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%"
        // Di layar sempit grafik tetap terbaca (gulir ke samping); saat dicetak mengecil agar muat satu kertas.
        style={{ "--lebar-min": `${Math.min(W, data.length * 26)}px` } as React.CSSProperties}
        role="img"
        aria-label={label}
        className="block min-w-(--lebar-min) print:min-w-0"
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const n = (atas / 4) * i;
          return (
            <g key={i}>
              <line x1={kiri} x2={W - 4} y1={y(n)} y2={y(n)} stroke={i === 0 ? "#b9d0c0" : "#E6F0E9"} strokeWidth="1" />
              <text x={kiri - 8} y={y(n) + 4} textAnchor="end" fontSize="11" fill="#566A5D">
                {n}
              </text>
            </g>
          );
        })}
        <path d={garis} fill="none" stroke={warna} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={d.nama}>
            <circle cx={x(i)} cy={y(d.jumlah)} r="5" fill={warna} stroke="#fbfdfb" strokeWidth="2">
              <title>{`${d.nama}: ${d.jumlah}`}</title>
            </circle>
            <text x={x(i)} y={y(d.jumlah) - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1A2B22">
              {d.jumlah}
            </text>
            {miring ? (
              <text x={x(i)} y={ATAS_G + tinggi + 14} textAnchor="end" fontSize="11" fill="#455a4d" transform={`rotate(-35 ${x(i)} ${ATAS_G + tinggi + 14})`}>
                {d.nama}
              </text>
            ) : (
              <text x={x(i)} y={ATAS_G + tinggi + 20} textAnchor="middle" fontSize="12" fill="#455a4d">
                {d.nama}
              </text>
            )}
          </g>
        ))}
      </svg>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.nama}>
              <th scope="row">{d.nama}</th>
              <td>{d.jumlah}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
