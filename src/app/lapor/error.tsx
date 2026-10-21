"use client";

import { GalatPelapor } from "@/components/galat-pelapor";

export default function Galat({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <GalatPelapor judul="Buat Laporan" error={error} reset={reset} />;
}
