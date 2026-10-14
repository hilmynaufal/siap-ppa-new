import { CalendarCheck, HeartHandshake, MapPin, QrCode } from "lucide-react";

/** Contoh tampilan tiket Pelapor untuk landing page. Isinya ilustrasi, bukan data asli. */
export function TiketContoh({ latar = "var(--color-canvas)" }: { latar?: string }) {
  return (
    <figure className="mx-auto w-full max-w-sm">
      <div className="relative -rotate-2 rounded-3xl bg-surface shadow-modal">
        <div className="rounded-t-3xl bg-brand-900 px-6 pb-6 pt-5 text-white">
          <p className="text-sm font-semibold text-brand-100">Tiket Anda</p>
          <p className="mt-1 text-5xl font-extrabold tabular-nums tracking-tight">A-014</p>
          <p className="mt-1 text-sm text-brand-100">Nomor antrean</p>
        </div>

        <div className="relative">
          <span aria-hidden="true" className="absolute -left-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full" style={{ background: latar }} />
          <span aria-hidden="true" className="absolute -right-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full" style={{ background: latar }} />
          <div className="mx-6 border-t-2 border-dashed border-line-strong" />
        </div>

        <ul className="flex flex-col gap-4 px-6 py-5">
          <li className="flex items-start gap-3">
            <CalendarCheck size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-green-500" />
            <span>
              <span className="block text-sm text-ink-mute">Jadwal pendampingan</span>
              <span className="block font-bold text-brand-900">Selasa, 13 Oktober 2026, 09.30</span>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <HeartHandshake size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-700" />
            <span>
              <span className="block text-sm text-ink-mute">Layanan</span>
              <span className="block font-bold text-brand-900">Pendampingan psikologis</span>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <MapPin size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-sky-500" />
            <span>
              <span className="block text-sm text-ink-mute">Lokasi layanan</span>
              <span className="block font-bold text-brand-900">UPTD PPA Kabupaten Bandung</span>
            </span>
          </li>
        </ul>

        <div className="flex items-center gap-3 rounded-b-3xl bg-brand-50 px-6 py-4">
          <QrCode size={40} aria-hidden="true" className="shrink-0 text-brand-900" />
          <p className="text-sm text-ink-soft">Tunjukkan kode ini ke petugas saat tiba di loket.</p>
        </div>
      </div>
      <figcaption className="mt-5 text-center text-sm text-ink-mute">Contoh tampilan tiket. Isinya hanya ilustrasi.</figcaption>
    </figure>
  );
}
