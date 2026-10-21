"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Ponsel } from "./ponsel";

export type Langkah = { judul: string; isi: string; poin: string[]; layar: ReactNode };

/**
 * Alur laporan bergaya cerita gulir: di layar lebar, ponsel menempel di kanan dan layarnya berganti mengikuti
 * langkah yang sedang dibaca; rel di kiri terisi mengikuti gulir (lihat `data-rel` di GerakBeranda).
 * Di ponsel, tiap langkah menampilkan layarnya sendiri di bawah teks.
 */
export function Perjalanan({ langkah }: { langkah: Langkah[] }) {
  const [aktif, setAktif] = useState(0);
  const butir = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entri) => {
        for (const e of entri) if (e.isIntersecting) setAktif(Number((e.target as HTMLElement).dataset.indeks));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    butir.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:gap-20">
      <ol data-rel className="relative">
        <span aria-hidden="true" className="absolute bottom-6 left-[27px] top-6 w-1 rounded-full bg-line-soft">
          <span data-rel-isi className="block h-full w-full origin-top rounded-full bg-brand-600" />
        </span>
        {langkah.map((l, i) => (
          <li
            key={l.judul}
            ref={(el) => {
              butir.current[i] = el;
            }}
            data-indeks={i}
            className="relative py-8 lg:flex lg:min-h-[78vh] lg:items-center lg:py-0"
          >
            <div className="flex w-full gap-6">
              <span
                aria-hidden="true"
                className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-xl font-extrabold tabular-nums transition-colors duration-500 ${
                  i <= aktif ? "bg-brand-600 text-white" : "bg-surface text-ink-mute ring-2 ring-line"
                }`}
              >
                {i < aktif ? <Check size={26} strokeWidth={3} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-brand-700">Langkah {i + 1}</p>
                <h3 className="text-balance mt-1 text-2xl font-extrabold leading-tight text-brand-900 md:text-3xl">{l.judul}</h3>
                <p className="mt-3 max-w-prose text-lg text-ink-soft">{l.isi}</p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {l.poin.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-ink">
                      <Check size={18} strokeWidth={2.75} aria-hidden="true" className="mt-1 shrink-0 text-brand-600" />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex justify-center lg:hidden">
                  <Ponsel className="scale-90">{l.layar}</Ponsel>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="hidden lg:block">
        <div className="sticky top-[calc(50vh-310px)]">
          <Ponsel>
            {langkah.map((l, i) => (
              <div
                key={l.judul}
                className={`absolute inset-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  i === aktif ? "opacity-100" : i < aktif ? "-translate-y-6 opacity-0" : "translate-y-6 opacity-0"
                }`}
              >
                {l.layar}
              </div>
            ))}
          </Ponsel>
          <p className="mt-5 text-center text-sm font-bold text-ink-mute" aria-hidden="true">
            Layar {aktif + 1} dari {langkah.length}
          </p>
        </div>
      </div>
    </div>
  );
}
