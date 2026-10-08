"use client";

import { Camera, CameraOff, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fokus } from "@/components/ui-form";

type Pendeteksi = { detect: (s: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type PabrikPendeteksi = new (o: { formats: string[] }) => Pendeteksi;

/**
 * Pemindai QR tiket dengan kamera (BarcodeDetector bawaan peramban). Bila peramban tidak mendukung atau kamera ditolak,
 * petugas tetap dapat mengetik kode di formulir di sebelahnya.
 */
export function PemindaiQr({ onKode }: { onKode: (kode: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [aktif, setAktif] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const onKodeRef = useRef(onKode);
  useEffect(() => {
    onKodeRef.current = onKode;
  }, [onKode]);

  useEffect(() => {
    if (!aktif) return;
    let berhenti = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    (async () => {
      const Pabrik = (globalThis as unknown as { BarcodeDetector?: PabrikPendeteksi }).BarcodeDetector;
      if (!Pabrik || !navigator.mediaDevices?.getUserMedia) {
        setPesan("Peramban ini tidak mendukung pemindaian QR. Ketik kode tiket di bawah.");
        setAktif(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (berhenti) return stream.getTracks().forEach((t) => t.stop());
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        const det = new Pabrik({ formats: ["qr_code"] });
        let terakhir = "";
        timer = setInterval(async () => {
          try {
            const hasil = await det.detect(v);
            const kode = hasil[0]?.rawValue;
            // Kode yang sama tidak dikirim berulang selama masih di depan kamera.
            if (kode && kode !== terakhir) {
              terakhir = kode;
              onKodeRef.current(kode);
            } else if (!kode) terakhir = "";
          } catch {
            /* bingkai belum siap */
          }
        }, 500);
      } catch {
        setPesan("Kamera tidak dapat dibuka. Izinkan akses kamera atau ketik kode tiket di bawah.");
        setAktif(false);
      }
    })();
    return () => {
      berhenti = true;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [aktif]);

  return (
    <div>
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-navy-900 text-white">
        <video ref={video} muted playsInline aria-label="Tampilan kamera pemindai QR" className={aktif ? "absolute inset-0 h-full w-full object-cover" : "hidden"} />
        {!aktif && (
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <ScanLine size={40} aria-hidden="true" />
            <p className="font-bold">Arahkan QR tiket ke kamera</p>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          setPesan(null);
          setAktif((a) => !a);
        }}
        aria-pressed={aktif}
        className={`mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface text-sm font-bold text-ink hover:bg-blue-50 ${fokus}`}
      >
        {aktif ? <CameraOff size={18} aria-hidden="true" /> : <Camera size={18} aria-hidden="true" />}
        {aktif ? "Matikan kamera" : "Nyalakan kamera"}
      </button>
      {pesan && (
        <p role="status" className="mt-2 text-sm text-warning">
          {pesan}
        </p>
      )}
    </div>
  );
}
