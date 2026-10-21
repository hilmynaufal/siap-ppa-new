"use client";

import { GalatPelapor } from "@/components/galat-pelapor";

export default function Galat({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <GalatPelapor judul="Cek Tiket" error={error} reset={reset} />;
}
