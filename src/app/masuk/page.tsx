import { redirect } from "next/navigation";
import { berandaUntuk } from "@/lib/akses";
import { penggunaSaatIni } from "@/lib/auth";
import { FormMasuk } from "./form-masuk";

export const metadata = { title: "Masuk | SIAP PPA" };

export default async function HalamanMasuk() {
  const pengguna = await penggunaSaatIni();
  if (pengguna) redirect(berandaUntuk(pengguna.peran));

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="flex flex-col justify-center gap-4 bg-[#EEEBFB] px-8 py-12 md:px-16">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#5847C2] text-sm font-extrabold text-white">
            PPA
          </span>
          <span className="font-bold text-[#46379E]">SIAP PPA</span>
        </div>
        <h1 className="text-3xl font-extrabold leading-tight text-[#1F1D2B]">
          Sistem informasi akses pelayanan perlindungan perempuan dan anak
        </h1>
        <p className="text-[#4A4859]">DALDUK PPA Kabupaten Bandung</p>
      </section>
      <section className="flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          <h2 className="mb-6 text-2xl font-extrabold text-[#1F1D2B]">Masuk</h2>
          <FormMasuk />
        </div>
      </section>
    </main>
  );
}
