"use client";

import { animate, createScope, createTimer, onScroll, stagger, svg, utils } from "animejs";
import { useEffect, useRef, type ReactNode } from "react";

const angka = new Intl.NumberFormat("id-ID");
const EASE = "outExpo";

/**
 * Penggerak animasi landing page (anime.js). Markah tetap dirender server dan sudah lengkap tanpa JavaScript;
 * komponen ini hanya menambahkan gerak lewat atribut data:
 *
 * - `data-muncul` (nilai = tunda ms): naik dan muncul saat terlihat. `data-muncul-grup`: anak-anaknya bergantian.
 * - `data-hitung` (nilai = angka akhir): angka berjalan dari 0. `data-batang`: batang anak `[data-batang-isi]` tumbuh.
 * - `data-tirai`: isi dibuka dari kiri. `data-gambar`: garis SVG digambar.
 * - Hero: `data-cincin`, `data-putar`, `data-hero-ponsel`, `data-hero-chip`, `data-apung`, `data-nomor-hero`, `data-denyut`.
 * - Peraga berulang: `data-ketik`, `data-progres`, `data-tukar`, `data-balik`, `data-pindai`, `data-detak`, `data-rel`.
 *
 * Semua gerak dilewati bila pengguna meminta gerak minimal (prefers-reduced-motion), dan dibersihkan saat lepas.
 */
export function GerakBeranda({ children }: { children: ReactNode }) {
  const akar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = createScope({ root: akar, mediaQueries: { gerak: "(prefers-reduced-motion: no-preference)" } }).add((self) => {
      const root = akar.current;
      if (!root || !self?.matches.gerak) return;

      const semua = <T extends Element = HTMLElement>(sel: string, dari: ParentNode = root) => Array.from(dari.querySelectorAll<T & Element>(sel)) as T[];
      const pengamat: IntersectionObserver[] = [];
      const diBawahLayar = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.9;

      /** Jalankan `fn` sekali saat elemen mulai terlihat. */
      const saatTerlihat = (el: Element, fn: () => void, ambang = 0.2) => {
        const io = new IntersectionObserver(
          (entri) => {
            if (entri.some((e) => e.isIntersecting)) {
              io.disconnect();
              fn();
            }
          },
          { threshold: ambang, rootMargin: "0px 0px -8% 0px" },
        );
        io.observe(el);
        pengamat.push(io);
      };

      // ---------- Hero ----------
      animate(semua("[data-cincin]"), { strokeDashoffset: [1, 0], duration: 2200, delay: stagger(220, { start: 150 }), ease: "inOutQuart" });
      animate(semua("[data-putar]"), { rotate: 360, duration: 90000, ease: "linear", loop: true });
      animate(semua("[data-hero-ponsel]"), { opacity: [0, 1], y: [70, 0], rotate: [6, -2], duration: 1500, delay: 250, ease: EASE });
      animate(semua("[data-hero-chip]"), { opacity: [0, 1], scale: [0.8, 1], y: [24, 0], duration: 1100, delay: stagger(180, { start: 900 }), ease: EASE });
      semua("[data-apung]").forEach((el, i) => {
        animate(el, { y: [0, i % 2 ? 9 : -11], duration: 2800 + i * 450, delay: 1600, ease: "inOutSine", loop: true, alternate: true });
      });
      animate(semua("[data-garis-waktu] > li"), { opacity: [0, 1], x: [-14, 0], duration: 800, delay: stagger(140, { start: 1100 }), ease: EASE });
      semua("[data-nomor-hero]").forEach((el) => {
        const o = { n: 1 };
        animate(o, { n: 14, duration: 1800, delay: 700, ease: "outQuart", onUpdate: () => (el.textContent = `A-${String(Math.round(o.n)).padStart(3, "0")}`) });
      });
      animate(semua("[data-denyut]"), { scale: [1, 1.9], opacity: [0.55, 0], duration: 1700, ease: "outQuart", loop: true, loopDelay: 300 });

      // ---------- Muncul saat terlihat ----------
      semua("[data-muncul]").forEach((el) => {
        if (!diBawahLayar(el)) return;
        utils.set(el, { opacity: 0, y: 36 });
        saatTerlihat(el, () => animate(el, { opacity: 1, y: 0, duration: 1100, delay: Number(el.dataset.muncul) || 0, ease: EASE }));
      });
      semua("[data-muncul-grup]").forEach((grup) => {
        if (!diBawahLayar(grup)) return;
        const anak = Array.from(grup.children) as HTMLElement[];
        utils.set(anak, { opacity: 0, y: 32 });
        saatTerlihat(grup, () => animate(anak, { opacity: 1, y: 0, duration: 1000, delay: stagger(Number(grup.dataset.munculGrup) || 90), ease: EASE }), 0.1);
      });

      // ---------- Angka, grafik, garis ----------
      semua("[data-hitung]").forEach((el) => {
        const akhir = Number(el.dataset.hitung);
        if (!Number.isFinite(akhir) || !diBawahLayar(el)) return;
        el.textContent = "0";
        saatTerlihat(el, () => {
          const o = { n: 0 };
          animate(o, { n: akhir, duration: 2200, ease: "outQuart", onUpdate: () => (el.textContent = angka.format(Math.round(o.n))) });
        });
      });
      semua("[data-batang]").forEach((wadah) => {
        if (!diBawahLayar(wadah)) return;
        const isi = semua("[data-batang-isi]", wadah);
        const label = semua("[data-batang-label]", wadah);
        utils.set(isi, { scaleY: 0 });
        utils.set(label, { opacity: 0 });
        saatTerlihat(wadah, () => {
          animate(isi, { scaleY: 1, duration: 1300, delay: stagger(70), ease: EASE });
          animate(label, { opacity: 1, duration: 600, delay: stagger(70, { start: 600 }), ease: "outQuad" });
        });
      });
      semua("[data-tirai]").forEach((el) => {
        if (!diBawahLayar(el)) return;
        const ruas = Array.from(el.children) as HTMLElement[];
        utils.set(ruas, { scaleX: 0 });
        saatTerlihat(el, () => animate(ruas, { scaleX: 1, duration: 700, delay: stagger(180), ease: "outQuart" }));
      });
      semua("[data-gambar]").forEach((wadah) => {
        if (!diBawahLayar(wadah)) return;
        const garis = svg.createDrawable(semua<SVGGeometryElement>("path, circle, rect, polyline", wadah));
        utils.set(garis, { draw: "0 0" });
        saatTerlihat(wadah, () => animate(garis, { draw: ["0 0", "0 1"], duration: 1800, delay: stagger(160), ease: "inOutQuart" }));
      });

      // ---------- Peraga berulang (mulai saat terlihat) ----------
      semua("[data-ketik]").forEach((el) => {
        const penuh = el.dataset.ketik ?? "";
        saatTerlihat(el, () => {
          const o = { i: 0 };
          animate(o, { i: penuh.length, duration: penuh.length * 55, ease: "linear", loop: true, loopDelay: 2600, onUpdate: () => (el.textContent = penuh.slice(0, Math.round(o.i))) });
        });
      });
      semua("[data-progres]").forEach((el) => {
        const ruas = semua(":scope > * > *", el);
        saatTerlihat(el, () => animate(ruas, { scaleX: [0, 1], duration: 700, delay: stagger(650), ease: "outQuart", loop: true, loopDelay: 1400 }));
      });
      semua("[data-tukar]").forEach((el) => {
        const [a, b] = Array.from(el.children) as HTMLElement[];
        if (!a || !b) return;
        saatTerlihat(el, () => {
          animate(a, { opacity: [1, 0], y: [0, -8], duration: 450, delay: 1400, loop: true, alternate: true, loopDelay: 2200, ease: "inOutQuad" });
          animate(b, { opacity: [0, 1], y: [8, 0], duration: 450, delay: 1400, loop: true, alternate: true, loopDelay: 2200, ease: "inOutQuad" });
        });
      });
      semua("[data-balik]").forEach((el) => {
        let n = Number(el.dataset.balik) || 1;
        const awalan = el.dataset.awalan ?? "A-";
        saatTerlihat(el, () => {
          createTimer({
            duration: 3200,
            loop: true,
            onLoop: () => {
              n = n >= 40 ? 1 : n + 1;
              animate(el, {
                y: [0, -18],
                opacity: [1, 0],
                duration: 260,
                ease: "inQuad",
                onComplete: () => {
                  el.textContent = `${awalan}${String(n).padStart(3, "0")}`;
                  animate(el, { y: [18, 0], opacity: [0, 1], duration: 520, ease: EASE });
                },
              });
            },
          });
        });
      });
      semua("[data-pindai]").forEach((el) => {
        const jarak = (el.parentElement?.clientHeight ?? 160) - 20;
        animate(el, { y: [0, jarak], duration: 1900, ease: "inOutSine", loop: true, alternate: true });
      });
      animate(semua("[data-detak]"), { scale: [1, 1.1], duration: 900, ease: "inOutSine", loop: true, alternate: true });

      // ---------- Rel kemajuan yang mengikuti gulir ----------
      semua("[data-rel]").forEach((rel) => {
        const isi = rel.querySelector<HTMLElement>("[data-rel-isi]");
        if (!isi) return;
        animate(isi, { scaleY: [0, 1], ease: "linear", autoplay: onScroll({ target: rel, enter: "center top", leave: "center bottom", sync: 0.25 }) });
      });

      return () => pengamat.forEach((io) => io.disconnect());
    });
    return () => scope.revert();
  }, []);

  return <div ref={akar}>{children}</div>;
}
