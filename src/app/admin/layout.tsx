import { KepalaArea } from "@/components/kepala-area";
import { wajibPeran } from "@/lib/auth";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const pengguna = await wajibPeran("ADMIN");
  return (
    <div className="min-h-screen bg-[#F7F6FB]">
      <KepalaArea nama={pengguna.nama} peran="Admin" />
      {children}
    </div>
  );
}
