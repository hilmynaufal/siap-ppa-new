import { LogOut, ShieldCheck } from "lucide-react";
import { keluar } from "@/app/masuk/actions";
import { IkonKotak } from "./ikon-kotak";

export function KepalaArea({ nama, peran }: { nama: string; peran: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-[4.5rem] items-center justify-between gap-4 border-b border-line bg-surface px-4 md:px-8">
      <div className="flex items-center gap-3">
        <IkonKotak ikon={ShieldCheck} warna="magenta" ukuran="md" />
        <div>
          <p className="font-extrabold leading-tight text-navy-900">SIAP PPA</p>
          <p className="text-sm font-medium text-ink-mute">{peran}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm font-semibold text-ink sm:inline">{nama}</span>
        <form action={keluar}>
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-sm font-bold text-ink transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            <LogOut size={18} aria-hidden="true" />
            Keluar
          </button>
        </form>
      </div>
    </header>
  );
}
