/** Pemisah bagian berbentuk gelombang lembut. `warna` mengikuti latar bagian di bawahnya. */
export function Gelombang({ warna, balik = false, className = "" }: { warna: string; balik?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={`block h-10 w-full md:h-16 ${balik ? "rotate-180" : ""} ${className}`}
      style={{ fill: warna }}
    >
      <path d="M0 40 C180 90 360 0 600 30 C840 60 1020 90 1220 40 C1320 16 1390 20 1440 34 V80 H0 Z" />
    </svg>
  );
}
