import type { LucideIcon } from "lucide-react";

const WARNA = {
  teal: "bg-teal-500 text-white",
  green: "bg-green-500 text-white",
  amber: "bg-amber-400 text-navy-950",
  violet: "bg-violet-500 text-white",
  sky: "bg-sky-500 text-white",
  coral: "bg-coral-500 text-white",
  magenta: "bg-magenta-600 text-white",
  navy: "bg-navy-800 text-white",
  blue: "bg-blue-600 text-white",
} as const;

const UKURAN = {
  sm: { kotak: "h-8 w-8 rounded-lg", ikon: 18 },
  md: { kotak: "h-10 w-10 rounded-xl", ikon: 22 },
  lg: { kotak: "h-14 w-14 rounded-[14px]", ikon: 30 },
} as const;

export type WarnaIkon = keyof typeof WARNA;

/** Ikon di dalam kotak berwarna membulat; dekoratif, selalu didampingi teks. */
export function IkonKotak({
  ikon: Ikon,
  warna,
  ukuran = "md",
}: {
  ikon: LucideIcon;
  warna: WarnaIkon;
  ukuran?: keyof typeof UKURAN;
}) {
  const u = UKURAN[ukuran];
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center ${u.kotak} ${WARNA[warna]}`}>
      <Ikon size={u.ikon} strokeWidth={2.25} />
    </span>
  );
}
