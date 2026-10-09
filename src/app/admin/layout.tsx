import { Menu } from "lucide-react";
import { cookies } from "next/headers";
import { KepalaArea } from "@/components/kepala-area";
import { wajibPeran } from "@/lib/auth";
import { jumlahLaporanBaru } from "@/lib/dasbor";
import { db } from "@/lib/db";
import { NavigasiAdmin } from "./navigasi-admin";
import { COOKIE_SIDEBAR, SidebarAdmin } from "./sidebar-admin";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const pengguna = await wajibPeran("ADMIN");
  const jumlahBaru = await jumlahLaporanBaru(db);
  const awalKolaps = (await cookies()).get(COOKIE_SIDEBAR)?.value === "kolaps";
  return (
    <div className="min-h-screen bg-canvas">
      <KepalaArea nama={pengguna.nama} peran="Admin" />
      <details className="sticky top-[4.5rem] z-20 bg-navy-900 md:hidden">
        <summary className="flex h-12 cursor-pointer list-none items-center gap-2 px-4 font-bold text-surface">
          <Menu size={20} aria-hidden="true" />
          Menu
        </summary>
        <NavigasiAdmin jumlahBaru={jumlahBaru} />
      </details>
      <div className="flex min-h-[calc(100vh-4.5rem)]">
        <SidebarAdmin awalKolaps={awalKolaps} jumlahBaru={jumlahBaru} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
