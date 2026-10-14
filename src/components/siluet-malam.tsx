/** Pita perbukitan dan pepohonan dalam siluet untuk dasar bagian penutup (latar biru tua). Dekoratif. */
export function SiluetMalam({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" className={className}>
      <circle cx="1130" cy="70" r="58" fill="#D6EFDC" opacity="0.16" />
      <circle cx="1130" cy="70" r="34" fill="#D6EFDC" opacity="0.22" />
      <path d="M0 150 C160 96 300 96 460 140 C620 184 760 100 940 112 C1120 124 1280 170 1440 130 V220 H0 Z" fill="#0F5A32" />
      <path d="M0 184 C200 150 360 160 560 182 C760 204 960 150 1160 166 C1280 176 1370 190 1440 182 V220 H0 Z" fill="#046B35" />
      <g fill="#062F1A">
        <rect x="178" y="170" width="8" height="40" rx="4" />
        <ellipse cx="182" cy="154" rx="26" ry="38" />
        <rect x="236" y="178" width="6" height="32" rx="3" />
        <ellipse cx="239" cy="166" rx="18" ry="28" />
        <rect x="1262" y="172" width="8" height="38" rx="4" />
        <ellipse cx="1266" cy="156" rx="24" ry="36" />
      </g>
    </svg>
  );
}
