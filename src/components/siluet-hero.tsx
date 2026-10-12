/**
 * Pita perbukitan selebar hero dengan siluet ibu dan anak bergandengan. Diletakkan absolut di dasar hero
 * sehingga bukit-bukit berlapis menyatu dengan gradien latar. Dekoratif; SVG inline.
 */
export function SiluetHero({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" role="presentation" aria-hidden="true" focusable="false" className={className}>
      {/* matahari */}
      <circle cx="960" cy="92" r="76" fill="#FFD6EA" opacity="0.55" />
      <circle cx="960" cy="92" r="46" fill="#FFEAF4" opacity="0.9" />

      {/* burung */}
      <g fill="none" stroke="#214A9E" strokeWidth="3" strokeLinecap="round" opacity="0.6">
        <path d="M640 70 q8 -9 16 0 q8 -9 16 0" />
        <path d="M700 44 q6 -7 12 0 q6 -7 12 0" />
      </g>

      {/* perbukitan berlapis */}
      <path d="M0 150 C200 108 380 120 560 150 C760 186 960 118 1180 124 C1300 128 1380 150 1440 140 V260 H0 Z" fill="#C7D8FB" opacity="0.85" />
      <path d="M0 190 C220 150 420 160 640 190 C860 216 1060 160 1260 170 C1350 175 1410 190 1440 186 V260 H0 Z" fill="#9DB9F2" />
      <path d="M0 216 C240 196 460 206 700 216 C940 226 1160 202 1440 212 V260 H0 Z" fill="#214A9E" />

      {/* pepohonan */}
      <g fill="#0A1B44">
        <rect x="116" y="178" width="8" height="40" rx="4" />
        <ellipse cx="120" cy="160" rx="26" ry="38" />
        <rect x="176" y="188" width="6" height="30" rx="3" />
        <ellipse cx="179" cy="176" rx="18" ry="26" />
        <rect x="1296" y="184" width="8" height="34" rx="4" />
        <ellipse cx="1300" cy="168" rx="22" ry="34" />
      </g>

      {/* ibu dan anak bergandengan: gambar sumber diubah menjadi siluet satu warna (public/siluet-ibu-anak.webp) */}
      <image href="/siluet-ibu-anak.webp" x="736" y="0" width="168" height="218" preserveAspectRatio="xMidYMax meet" />
    </svg>
  );
}
