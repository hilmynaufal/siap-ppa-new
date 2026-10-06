import { KepalaArea } from "@/components/kepala-area";
import { wajibPeran } from "@/lib/auth";
import { NavigasiAdmin } from "./navigasi-admin";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const pengguna = await wajibPeran("ADMIN");
  return (
    <div className="min-h-screen bg-[#F7F6FB]">
      <KepalaArea nama={pengguna.nama} peran="Admin" />
      <details className="border-b border-[#DEDBE8] bg-white md:hidden">
        <summary className="flex h-12 cursor-pointer items-center px-4 font-bold">Menu</summary>
        <NavigasiAdmin />
      </details>
      <div className="flex min-h-[calc(100vh-4.5rem)]">
        <aside className="hidden w-[248px] shrink-0 border-r border-[#DEDBE8] bg-white md:block">
          <NavigasiAdmin />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
