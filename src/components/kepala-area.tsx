import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { keluar } from "@/app/masuk/actions";
import { LogoSiap } from "./logo-siap";

/** Kepala area masuk. Nama pengguna menuju halaman Profil (`profilHref`); di layar sempit tampil sebagai ikon. */
export function KepalaArea({ nama, peran, profilHref, ekstra }: { nama: string; peran: string; profilHref: string; ekstra?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-[4.5rem] items-center justify-between gap-4 border-b border-line bg-surface px-4 md:px-8">
      <div className="flex items-center gap-3">
        <LogoSiap />
        <div>
          <p className="font-extrabold leading-tight text-brand-900">SIAP PPA</p>
          <p className="text-sm font-medium text-ink-mute">{peran}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {ekstra}
        <Link
          href={profilHref}
          aria-label={`Profil: ${nama}`}
          className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-ink transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
        >
          <UserRound size={18} aria-hidden="true" className="text-brand-700" />
          <span className="hidden max-w-[16rem] truncate sm:inline">{nama}</span>
        </Link>
        <form action={keluar}>
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-sm font-bold text-ink transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
          >
            <LogOut size={18} aria-hidden="true" />
            Keluar
          </button>
        </form>
      </div>
    </header>
  );
}
