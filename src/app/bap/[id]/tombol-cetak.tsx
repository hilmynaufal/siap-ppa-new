"use client";

import { Printer } from "lucide-react";
import { tombolUtama } from "@/components/ui-form";

export function TombolCetak() {
  return (
    <button type="button" onClick={() => window.print()} className={tombolUtama}>
      <Printer size={18} aria-hidden="true" />
      Cetak / Simpan PDF
    </button>
  );
}
