import { AlertCircle, CheckCircle2, Clock, HeartHandshake, Lock } from "lucide-react";
import { LencanaStatus } from "./lencana-status";

export type StatusLaporanUi = "BARU" | "DITOLAK" | "TERVERIFIKASI" | "DALAM_PENDAMPINGAN" | "DITUTUP";

export const LABEL_STATUS: Record<StatusLaporanUi, string> = {
  BARU: "Menunggu verifikasi",
  TERVERIFIKASI: "Terverifikasi",
  DITOLAK: "Ditolak",
  DALAM_PENDAMPINGAN: "Dalam pendampingan",
  DITUTUP: "Ditutup",
};

/** Lencana status laporan: ikon + teks, nada mengikuti arti status. */
export function LencanaLaporan({ status }: { status: StatusLaporanUi }) {
  switch (status) {
    case "BARU":
      return <LencanaStatus nada="peringatan" ikon={Clock}>{LABEL_STATUS.BARU}</LencanaStatus>;
    case "TERVERIFIKASI":
      return <LencanaStatus nada="sukses" ikon={CheckCircle2}>{LABEL_STATUS.TERVERIFIKASI}</LencanaStatus>;
    case "DITOLAK":
      return <LencanaStatus nada="galat" ikon={AlertCircle}>{LABEL_STATUS.DITOLAK}</LencanaStatus>;
    case "DALAM_PENDAMPINGAN":
      return <LencanaStatus nada="info" ikon={HeartHandshake}>{LABEL_STATUS.DALAM_PENDAMPINGAN}</LencanaStatus>;
    case "DITUTUP":
      return <LencanaStatus nada="netral" ikon={Lock}>{LABEL_STATUS.DITUTUP}</LencanaStatus>;
  }
}
