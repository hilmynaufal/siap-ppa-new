import { Breadcrumb } from "@/components/breadcrumb";
import { db } from "@/lib/db";
import { daftarJenis } from "@/lib/jenis-kekerasan";
import { DaftarJenis } from "./daftar-jenis";

export const metadata = { title: "Jenis Kekerasan | SIAP PPA" };

export default async function HalamanJenisKekerasan() {
  const jenis = await daftarJenis(db);
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb
        remah={[{ label: "Beranda", href: "/admin" }, { label: "Data master" }, { label: "Jenis Kekerasan" }]}
      />
      <DaftarJenis jenis={jenis} />
    </main>
  );
}
