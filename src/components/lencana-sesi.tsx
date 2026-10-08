import { CheckCircle2, CircleDashed, CircleSlash, Clock, PlayCircle, UserX } from "lucide-react";
import { LencanaStatus } from "./lencana-status";

export type StatusSesiUi = "TERJADWAL" | "BERLANGSUNG" | "SELESAI" | "TIDAK_HADIR" | "DIBATALKAN";

export const LABEL_SESI: Record<StatusSesiUi, string> = {
  TERJADWAL: "Terjadwal",
  BERLANGSUNG: "Berlangsung",
  SELESAI: "Selesai",
  TIDAK_HADIR: "Tidak hadir",
  DIBATALKAN: "Dibatalkan",
};

/** Lencana status sesi: ikon + teks. */
export function LencanaSesi({ status }: { status: StatusSesiUi }) {
  switch (status) {
    case "TERJADWAL":
      return <LencanaStatus nada="info" ikon={Clock}>{LABEL_SESI.TERJADWAL}</LencanaStatus>;
    case "BERLANGSUNG":
      return <LencanaStatus nada="peringatan" ikon={PlayCircle}>{LABEL_SESI.BERLANGSUNG}</LencanaStatus>;
    case "SELESAI":
      return <LencanaStatus nada="sukses" ikon={CheckCircle2}>{LABEL_SESI.SELESAI}</LencanaStatus>;
    case "TIDAK_HADIR":
      return <LencanaStatus nada="galat" ikon={UserX}>{LABEL_SESI.TIDAK_HADIR}</LencanaStatus>;
    case "DIBATALKAN":
      return <LencanaStatus nada="netral" ikon={CircleSlash}>{LABEL_SESI.DIBATALKAN}</LencanaStatus>;
    default:
      return <LencanaStatus nada="netral" ikon={CircleDashed}>-</LencanaStatus>;
  }
}
