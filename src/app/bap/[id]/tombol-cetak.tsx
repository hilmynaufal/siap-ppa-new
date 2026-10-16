"use client";

import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { tombolUtama } from "@/components/ui-form";

/** Tombol cetak; menunggu sampai semua lampiran PDF selesai digambar. */
export function TombolCetak() {
  const [menunggu, setMenunggu] = useState(true);
  useEffect(() => {
    const periksa = () => setMenunggu(document.querySelector('[data-lampiran-siap="false"]') !== null);
    periksa();
    const pengamat = new MutationObserver(periksa);
    pengamat.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-lampiran-siap"], childList: true });
    return () => pengamat.disconnect();
  }, []);
  return (
    <button type="button" disabled={menunggu} onClick={() => window.print()} className={tombolUtama}>
      <Printer size={18} aria-hidden="true" />
      {menunggu ? "Menyiapkan lampiran..." : "Cetak / Simpan PDF"}
    </button>
  );
}
