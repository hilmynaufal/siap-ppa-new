import { CalendarCheck, HeartHandshake, QrCode, Ticket } from "lucide-react";
import { redirect } from "next/navigation";
import { IkonKotak } from "@/components/ikon-kotak";
import { LogoSiapLengkap } from "@/components/logo-siap";
import { berandaUntuk } from "@/lib/akses";
import { penggunaSaatIni } from "@/lib/auth";
import { FormMasuk } from "./form-masuk";

export const metadata = { title: "Masuk | SIAP PPA" };

const FITUR = [
  { ikon: QrCode, warna: "violet", label: "Lapor lewat QR" },
  { ikon: Ticket, warna: "coral", label: "Tiket dan antrean" },
  { ikon: CalendarCheck, warna: "teal", label: "Jadwal pendampingan" },
  { ikon: HeartHandshake, warna: "magenta", label: "Pendampingan" },
] as const;

export default async function HalamanMasuk() {
  const pengguna = await penggunaSaatIni();
  if (pengguna) redirect(berandaUntuk(pengguna.peran));

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="hero-lembut flex flex-col justify-center gap-6 px-6 py-10 md:px-14">
        <LogoSiapLengkap lebar={200} />
        <div>
          <h1 className="text-3xl font-extrabold leading-tight text-brand-900 md:text-4xl">
            Satu akses layanan, perlindungan lebih baik
          </h1>
          <p className="mt-3 max-w-md text-ink-soft">
            Sistem informasi pelayanan perlindungan perempuan dan anak, DALDUK PPA Kabupaten Bandung.
          </p>
        </div>
        <ul className="grid max-w-md grid-cols-2 gap-3">
          {FITUR.map((f) => (
            <li key={f.label} className="flex items-center gap-3 rounded-2xl bg-surface/80 p-3">
              <IkonKotak ikon={f.ikon} warna={f.warna} ukuran="md" />
              <span className="text-sm font-bold text-brand-900">{f.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center justify-center bg-surface px-6 py-10">
        <div className="w-full max-w-sm">
          <h2 className="mb-1 text-2xl font-extrabold text-brand-900">Masuk</h2>
          <p className="mb-6 text-ink-soft">Untuk Admin dan Pendamping.</p>
          <FormMasuk />
        </div>
      </section>
    </main>
  );
}
