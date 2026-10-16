import { HalamanProfil } from "@/components/halaman-profil";
import { wajibPeran } from "@/lib/auth";

export const metadata = { title: "Profil | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function Halaman() {
  const pengguna = await wajibPeran("PENDAMPING");
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <HalamanProfil pengguna={pengguna} />
    </main>
  );
}
