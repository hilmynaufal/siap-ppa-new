import Image from "next/image";

/** Simbol logo SIAP PPA (ibu, anak, dan daun dalam lingkaran; desain pihak UPTD PPA). Dekoratif; nama ada di teks di sebelahnya. */
export function LogoSiap({ ukuran = 44, className }: { ukuran?: number; className?: string }) {
  return <Image src="/brand/simbol.webp" alt="" width={ukuran} height={ukuran} aria-hidden="true" className={className} unoptimized />;
}

/** Logo lengkap berlatar terang (simbol, nama, dan tagline). Gambar dasarnya berukuran 1078x977. */
export function LogoSiapLengkap({ lebar = 280, className }: { lebar?: number; className?: string }) {
  return (
    <Image src="/brand/siap-ppa-lengkap.webp" alt="SIAP PPA, Perlindungan Perempuan dan Anak" width={lebar} height={Math.round((lebar * 977) / 1078)} className={className} unoptimized priority />
  );
}
