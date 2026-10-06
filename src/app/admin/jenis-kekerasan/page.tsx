import { db } from "@/lib/db";
import { daftarJenis } from "@/lib/jenis-kekerasan";
import { DaftarJenis } from "./daftar-jenis";

export const metadata = { title: "Jenis Kekerasan | SIAP PPA" };

export default async function HalamanJenisKekerasan() {
  const jenis = await daftarJenis(db);
  return (
    <main className="mx-auto max-w-5xl px-8 py-8">
      <DaftarJenis jenis={jenis} />
    </main>
  );
}
