"use client";

import { useEffect, useState } from "react";

/** Skala gambar halaman PDF: 2x agar teks tetap tajam saat dicetak. */
const SKALA = 2;

/**
 * Menggambar setiap halaman sebuah PDF lampiran menjadi gambar agar ikut tercetak bersama BAP.
 * Selama belum selesai, elemen ditandai `data-lampiran-siap="false"` sehingga tombol cetak menunggu.
 */
export function LampiranPdf({ src, judul }: { src: string; judul: string }) {
  const [halaman, setHalaman] = useState<string[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const res = await fetch(src, { credentials: "same-origin", cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const tugas = pdfjs.getDocument({ data: new Uint8Array(await res.arrayBuffer()) });
        const doc = await tugas.promise;
        const hasil: string[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: SKALA });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
          hasil.push(canvas.toDataURL("image/jpeg", 0.9));
        }
        await tugas.destroy();
        if (!batal) setHalaman(hasil);
      } catch {
        if (!batal) setGalat("PDF ini tidak dapat ditampilkan. Cetak berkas aslinya secara terpisah.");
      } finally {
        if (!batal) setSiap(true);
      }
    })();
    return () => {
      batal = true;
    };
  }, [src]);

  return (
    <div data-lampiran-siap={siap ? "true" : "false"}>
      {!siap && <p className="bap-catatan">Menyiapkan halaman PDF...</p>}
      {galat && <p className="bap-catatan">{galat}</p>}
      {halaman.map((h, i) => (
        <figure key={i} className={i > 0 ? "bap-lampiran-halaman bap-halaman-baru" : "bap-lampiran-halaman"}>
          {i > 0 && <p className="bap-judul-kecil">{judul} (lanjutan)</p>}
          {/* eslint-disable-next-line @next/next/no-img-element -- gambar data dari kanvas, dicetak apa adanya */}
          <img src={h} alt={`Halaman ${i + 1} dari ${halaman.length}`} className="bap-lampiran-gambar" />
          <figcaption className="bap-catatan">
            Halaman {i + 1} dari {halaman.length}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

