/**
 * Pita perbukitan selebar hero dengan siluet ibu memeluk anaknya dari samping. Diletakkan absolut di dasar hero
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

      {/* ibu memeluk anak dari samping */}
      <g fill="#0A1B44" transform="translate(628 -58) scale(0.8)">
        <circle cx="232" cy="102" r="10" />
        <circle cx="246" cy="120" r="21" />
        <path d="M230 140 C212 152 200 178 198 212 C196 254 176 306 156 342 L278 342 C268 302 256 264 256 234 C256 206 266 180 262 160 C260 150 254 144 246 140 Z" />
        <path d="M256 172 C276 202 298 228 324 238" fill="none" stroke="#0A1B44" strokeWidth="14" strokeLinecap="round" />
        <path d="M310 192 C328 186 338 202 331 218 C327 206 322 200 312 200 Z" />
        <circle cx="296" cy="196" r="15" />
        <path d="M299 213 C287 218 283 234 284 252 C283 286 277 318 273 342 L331 342 C327 318 322 286 322 254 C322 234 318 220 308 214 Z" />
        <path d="M296 238 C284 244 270 242 258 236" fill="none" stroke="#0A1B44" strokeWidth="9" strokeLinecap="round" />
      </g>
    </svg>
  );
}
