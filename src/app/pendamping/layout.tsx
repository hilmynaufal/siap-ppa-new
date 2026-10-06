import { KepalaArea } from "@/components/kepala-area";
import { wajibPeran } from "@/lib/auth";

export default async function LayoutPendamping({ children }: { children: React.ReactNode }) {
  const pengguna = await wajibPeran("PENDAMPING");
  return (
    <div className="min-h-screen bg-[#F7F6FB]">
      <KepalaArea nama={pengguna.nama} peran="Pendamping" />
      {children}
    </div>
  );
}
