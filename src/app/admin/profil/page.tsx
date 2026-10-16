import { Breadcrumb } from "@/components/breadcrumb";
import { HalamanProfil } from "@/components/halaman-profil";
import { wajibPeran } from "@/lib/auth";

export const metadata = { title: "Profil | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function Halaman() {
  const pengguna = await wajibPeran("ADMIN");
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Profil" }]} />
      <HalamanProfil pengguna={pengguna} />
    </main>
  );
}
