"use client";

import { animate, type JSAnimation } from "animejs";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const KUERI = "(prefers-reduced-motion: reduce)";
const langgan = (cb: () => void) => {
  const mq = window.matchMedia(KUERI);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Pita berjalan berisi jenis kekerasan yang dapat dilaporkan. Ada tombol jeda (WCAG 2.2.2), dan pita berhenti
 * menjadi daftar biasa bila pengguna meminta gerak minimal.
 */
export function PitaJenis({ jenis }: { jenis: string[] }) {
  const lintasan = useRef<HTMLDivElement>(null);
  const anim = useRef<JSAnimation | null>(null);
  const [jalan, setJalan] = useState(true);
  const gerak = useSyncExternalStore(langgan, () => !window.matchMedia(KUERI).matches, () => true);

  useEffect(() => {
    if (!gerak || !lintasan.current) return;
    anim.current = animate(lintasan.current, { x: ["0%", "-50%"], duration: jenis.length * 4200, ease: "linear", loop: true });
    return () => {
      anim.current?.revert();
      anim.current = null;
    };
  }, [gerak, jenis.length]);

  const alihkan = () => {
    if (jalan) anim.current?.pause();
    else anim.current?.play();
    setJalan(!jalan);
  };

  const butir = (salinan: boolean) => (
    <ul aria-hidden={salinan || undefined} className="flex shrink-0 items-center">
      {jenis.map((j) => (
        <li key={j} className="flex items-center whitespace-nowrap px-5 text-xl font-extrabold text-brand-950 md:text-2xl">
          <svg viewBox="0 0 20 20" aria-hidden="true" className="mr-5 h-4 w-4 shrink-0 fill-brand-700">
            <path d="M10 0c1 5 5 9 10 10-5 1-9 5-10 10C9 15 5 11 0 10 5 9 9 5 10 0Z" />
          </svg>
          {j}
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-labelledby="judul-pita" className="relative bg-sun-400">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
        <h2 id="judul-pita" className="sr-only shrink-0 rounded-lg sm:not-sr-only bg-brand-950 px-3 py-2 text-sm font-bold text-sun-50">
          Yang dapat dilaporkan
        </h2>
        <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
          {gerak ? (
            <div ref={lintasan} className="flex w-max">
              {butir(false)}
              {butir(true)}
            </div>
          ) : (
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {jenis.map((j) => (
                <li key={j} className="text-lg font-extrabold text-brand-950">
                  {j}
                </li>
              ))}
            </ul>
          )}
        </div>
        {gerak && (
          <button
            type="button"
            onClick={alihkan}
            aria-label={jalan ? "Jeda pita berjalan" : "Jalankan pita"}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-950/10 text-brand-950 transition-colors hover:bg-brand-950/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-950/30"
          >
            {jalan ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
    </section>
  );
}
