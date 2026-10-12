/** Simbol logo SIAP PPA (Naungan): lengkung navy merangkul titik magenta. Dekoratif; nama ada di teks di sebelahnya. */
export function LogoSiap({ ukuran = 44, className }: { ukuran?: number; className?: string }) {
  return (
    <svg
      viewBox="20 20 216 216"
      width={ukuran}
      height={ukuran}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M56 218V124a72 72 0 0 1 144 0v94"
        fill="none"
        stroke="var(--color-navy-900)"
        strokeWidth="42"
        strokeLinecap="round"
      />
      <circle cx="128" cy="154" r="32" fill="var(--color-magenta-600)" />
    </svg>
  );
}
