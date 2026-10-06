import { AlertCircle, CheckCircle2, Clock, EyeOff, Info, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const NADA = {
  sukses: { kelas: "bg-success-50 text-success", ikon: CheckCircle2 },
  netral: { kelas: "bg-line-soft text-ink-soft", ikon: EyeOff },
  info: { kelas: "bg-info-50 text-info", ikon: Info },
  peringatan: { kelas: "bg-warning-50 text-warning", ikon: Clock },
  galat: { kelas: "bg-error-50 text-error", ikon: AlertCircle },
} as const;

export type NadaLencana = keyof typeof NADA;

/** Lencana status: selalu ikon + teks, tidak pernah hanya warna. */
export function LencanaStatus({
  nada,
  ikon,
  children,
}: {
  nada: NadaLencana;
  ikon?: LucideIcon;
  children: ReactNode;
}) {
  const n = NADA[nada];
  const Ikon = ikon ?? n.ikon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${n.kelas}`}>
      <Ikon size={14} strokeWidth={2.5} aria-hidden="true" />
      {children}
    </span>
  );
}
