import { KepalaArea } from "@/components/kepala-area";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { NavigasiPetugas } from "./navigasi-petugas";

export default async function LayoutPetugas({ children }: { children: React.ReactNode }) {
  const pengguna = await wajibPeran("PETUGAS");
  const lokasi = pengguna.lokasiId ? await db.lokasi.findUnique({ where: { id: pengguna.lokasiId }, select: { nama: true } }) : null;
  return (
    <div className="min-h-screen bg-canvas">
      <KepalaArea nama={pengguna.nama} peran={lokasi ? `Petugas · ${lokasi.nama}` : "Petugas"} />
      <NavigasiPetugas />
      {children}
    </div>
  );
}
