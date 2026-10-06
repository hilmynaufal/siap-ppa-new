import type { Peran } from "./session";

/** Area aplikasi yang memerlukan masuk, beserta peran yang berhak. Pelapor tanpa akun. */
const AREA: { prefix: string; peran: Peran[] }[] = [
  { prefix: "/admin", peran: ["ADMIN"] },
  { prefix: "/pendamping", peran: ["PENDAMPING"] },
];

export function areaUntukPath(pathname: string) {
  return AREA.find((a) => pathname === a.prefix || pathname.startsWith(a.prefix + "/"));
}

export type KeputusanAkses =
  | { aksi: "izinkan" }
  | { aksi: "ke-masuk" }
  | { aksi: "ke-beranda"; peran: Peran };

/** Halaman publik (Pelapor, masuk) selalu diizinkan; area terlindungi butuh sesi dan peran yang tepat. */
export function putuskanAkses(pathname: string, peran: Peran | null): KeputusanAkses {
  const area = areaUntukPath(pathname);
  if (!area) return { aksi: "izinkan" };
  if (!peran) return { aksi: "ke-masuk" };
  if (!area.peran.includes(peran)) return { aksi: "ke-beranda", peran };
  return { aksi: "izinkan" };
}

export function berandaUntuk(peran: Peran): string {
  return peran === "ADMIN" ? "/admin" : "/pendamping";
}
