"use client";

import { CalendarClock, CheckCircle2, Copy, MapPin, MessageCircle, Send, Ticket, TriangleAlert, UserRound } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { Galat, Modal, tombolKecil, tombolNetral, tombolUtama } from "@/components/ui-form";
import type { InfoWa } from "@/lib/wa-jadwal";
import { catatWaAksi, infoWaAksi } from "../actions";

function Baris({ ikon, children }: { ikon: typeof MapPin; children: ReactNode }) {
  const Ikon = ikon;
  return (
    <li className="flex items-start gap-2">
      <Ikon size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute" />
      <span>{children}</span>
    </li>
  );
}

/**
 * Modal pengiriman info jadwal lewat WhatsApp (semi-otomatis): menampilkan ringkasan jadwal,
 * membuka WhatsApp dengan pesan yang sudah terisi, dan mencatat pembukaannya.
 */
export function ModalKirimWa({ info, judul, subjudul, onTutup }: { info: InfoWa; judul: string; subjudul: string; onTutup: () => void }) {
  const [tersalin, setTersalin] = useState(false);
  const [dibuka, setDibuka] = useState(false);
  const r = info.ringkas;

  return (
    <Modal idJudul="judul-kirim-wa" idSubjudul="sub-kirim-wa" ikon={CheckCircle2} warna="green" judul={judul} subjudul={subjudul} onTutup={onTutup}>
      <ul className="mt-5 flex flex-col gap-2 rounded-xl bg-canvas p-4 text-sm text-ink">
        <Baris ikon={Ticket}>
          {r.jenis}
          {r.nomorAntrean && (
            <>
              {" "}
              · antrean <span className="font-bold tabular-nums">{r.nomorAntrean}</span>
            </>
          )}
        </Baris>
        <Baris ikon={CalendarClock}>{r.waktu}</Baris>
        <Baris ikon={MapPin}>{r.lokasi}</Baris>
        <Baris ikon={UserRound}>
          Dikirim ke {info.penerima || "pelapor"}
          {info.nomor && <span className="tabular-nums"> ({info.nomor})</span>}
        </Baris>
      </ul>

      {!info.tautanWa && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-warning-50 p-3 text-sm text-warning">
          <TriangleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          Nomor kontak bukan nomor ponsel yang dapat dihubungi lewat WhatsApp. Salin pesan lalu kirim lewat cara lain.
        </p>
      )}

      <details className="mt-4 rounded-xl border border-line p-3 text-sm">
        <summary className="cursor-pointer font-bold text-ink">Lihat isi pesan</summary>
        <p className="mt-2 whitespace-pre-wrap break-words text-ink-soft">{info.pesan}</p>
      </details>

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onTutup} className={tombolNetral}>
          Tutup
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(info.pesan);
              setTersalin(true);
            } catch {
              setTersalin(false);
            }
          }}
          className={tombolNetral}
        >
          <Copy size={18} aria-hidden="true" />
          {tersalin ? "Pesan tersalin" : "Salin pesan"}
        </button>
        {info.tautanWa && (
          <a
            href={info.tautanWa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              setDibuka(true);
              void catatWaAksi(info.sesiId);
            }}
            className={tombolUtama}
          >
            <Send size={18} aria-hidden="true" />
            Kirim info lewat WhatsApp
          </a>
        )}
      </div>
      {dibuka && (
        <p className="mt-3 text-right text-sm text-ink-soft" aria-live="polite">
          WhatsApp dibuka di tab baru. Tekan kirim di WhatsApp untuk mengirim pesan.
        </p>
      )}
    </Modal>
  );
}

/** Tombol kirim ulang info jadwal sebuah sesi lewat WhatsApp (mis. setelah modal verifikasi ditutup). */
export function TombolKirimWa({ sesiId, kode, waTerakhir }: { sesiId: string; kode: string; waTerakhir: string | null }) {
  const [info, setInfo] = useState<InfoWa | null>(null);
  const [galat, setGalat] = useState<string | undefined>();
  const [pending, mulai] = useTransition();
  const kapan = waTerakhir
    ? new Date(waTerakhir).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ":")
    : null;
  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          mulai(async () => {
            const h = await infoWaAksi(sesiId);
            if (h.ok) {
              setGalat(undefined);
              setInfo(h.info);
            } else setGalat(h.pesan);
          })
        }
        className={`${tombolKecil} border-line-strong text-ink hover:bg-brand-50`}
      >
        <MessageCircle size={16} aria-hidden="true" />
        {pending ? "Menyiapkan..." : "Kirim info WA"}
      </button>
      {kapan && <span className="text-xs text-ink-mute">WA dibuka {kapan}</span>}
      <Galat id={`galat-wa-${sesiId}`} pesan={galat} />
      {info && <ModalKirimWa info={info} judul="Kirim info jadwal" subjudul={`Laporan ${kode}. Pesan berisi jadwal dan tautan Cek Tiket.`} onTutup={() => setInfo(null)} />}
    </div>
  );
}
