"use client";

import { CheckCheck, Play, UserX } from "lucide-react";
import { useState, useTransition } from "react";
import { Galat, Modal, fokus, tombolNetral, tombolUtama } from "@/components/ui-form";
import type { StatusSesiUi } from "@/components/lencana-sesi";
import { ubahStatus } from "./actions";

type Props = { id: string; status: StatusSesiUi; bisaMulai: boolean; kecil?: boolean; kode: string };

const tinggi = (kecil?: boolean) => (kecil ? "h-11 px-4 text-sm" : "h-12 px-6");

/** Tombol ubah status sesi menurut status saat ini. Tidak hadir meminta konfirmasi karena tidak dapat dibatalkan. */
export function AksiSesi({ id, status, bisaMulai, kecil, kode }: Props) {
  const [pending, mulai] = useTransition();
  const [pesan, setPesan] = useState<string | null>(null);
  const [konfirmasi, setKonfirmasi] = useState(false);

  function kirim(target: "BERLANGSUNG" | "SELESAI" | "TIDAK_HADIR") {
    setPesan(null);
    mulai(async () => {
      const h = await ubahStatus(id, target);
      if (!h.ok) setPesan(h.pesan);
      setKonfirmasi(false);
    });
  }

  if (status !== "TERJADWAL" && status !== "BERLANGSUNG") return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {status === "TERJADWAL" && (
          <>
            <button
              type="button"
              disabled={pending || !bisaMulai}
              title={bisaMulai ? undefined : "Sesi baru dapat dimulai pada hari pelaksanaan"}
              onClick={() => kirim("BERLANGSUNG")}
              className={`inline-flex ${tinggi(kecil)} items-center justify-center gap-2 rounded-xl bg-magenta-600 font-bold text-white shadow-card transition-colors hover:bg-magenta-700 disabled:cursor-not-allowed disabled:bg-line-strong disabled:shadow-none ${fokus}`}
            >
              <Play size={16} aria-hidden="true" />
              Mulai sesi
            </button>
            <button
              type="button"
              disabled={pending || !bisaMulai}
              title={bisaMulai ? undefined : "Dapat ditandai pada hari pelaksanaan"}
              onClick={() => setKonfirmasi(true)}
              className={`inline-flex ${tinggi(kecil)} items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface font-bold text-ink transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-line-strong ${fokus}`}
            >
              <UserX size={16} aria-hidden="true" />
              Tandai tidak hadir
            </button>
          </>
        )}
        {status === "BERLANGSUNG" && (
          <button type="button" disabled={pending} onClick={() => kirim("SELESAI")} className={`${tombolUtama} ${kecil ? "!h-11 !px-4 text-sm" : ""}`}>
            <CheckCheck size={16} aria-hidden="true" />
            Selesaikan sesi
          </button>
        )}
      </div>
      <Galat id={`galat-sesi-${id}`} pesan={pesan ?? undefined} />

      {konfirmasi && (
        <Modal
          idJudul={`judul-th-${id}`}
          idSubjudul={`sub-th-${id}`}
          ikon={UserX}
          warna="coral"
          judul="Tandai tidak hadir?"
          subjudul={`Sesi laporan ${kode} akan ditandai Tidak hadir dan antreannya dilewati. Tindakan ini tidak dapat dibatalkan.`}
          onTutup={() => setKonfirmasi(false)}
        >
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => setKonfirmasi(false)} className={tombolNetral} autoFocus>
              Batal
            </button>
            <button type="button" disabled={pending} onClick={() => kirim("TIDAK_HADIR")} className={tombolUtama}>
              Ya, tandai tidak hadir
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
