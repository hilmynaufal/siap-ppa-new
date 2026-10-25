import { describe, expect, it } from "vitest";
import { adaLaporanLebihBaru, judulDenganJumlah, pesanNotifikasi } from "./notifikasi-laporan";

describe("notifikasi laporan baru", () => {
  const t1 = "2026-10-25T01:00:00.000Z";
  const t2 = "2026-10-25T01:05:00.000Z";
  it("memberi tahu hanya bila ada laporan yang lebih baru dari pemeriksaan sebelumnya", () => {
    expect(adaLaporanLebihBaru({ jumlah: 1, terbaru: t1 }, { jumlah: 2, terbaru: t2 })).toBe(true);
    expect(adaLaporanLebihBaru({ jumlah: 0, terbaru: null }, { jumlah: 1, terbaru: t1 })).toBe(true);
    // Laporan diverifikasi (jumlah turun) atau tidak ada perubahan: diam.
    expect(adaLaporanLebihBaru({ jumlah: 2, terbaru: t2 }, { jumlah: 1, terbaru: t2 })).toBe(false);
    expect(adaLaporanLebihBaru({ jumlah: 2, terbaru: t2 }, { jumlah: 2, terbaru: t2 })).toBe(false);
    expect(adaLaporanLebihBaru({ jumlah: 1, terbaru: t1 }, { jumlah: 0, terbaru: null })).toBe(false);
  });
  it("judul tab memuat jumlah tanpa menumpuk awalan", () => {
    expect(judulDenganJumlah("Dasbor | SIAP PPA", 3)).toBe("(3) Dasbor | SIAP PPA");
    expect(judulDenganJumlah("(3) Dasbor | SIAP PPA", 4)).toBe("(4) Dasbor | SIAP PPA");
    expect(judulDenganJumlah("(3) Dasbor | SIAP PPA", 0)).toBe("Dasbor | SIAP PPA");
  });
  it("isi notifikasi tidak memuat data laporan", () => {
    expect(pesanNotifikasi(1)).toEqual({ judul: "Laporan baru masuk", isi: "1 laporan menunggu verifikasi." });
    expect(pesanNotifikasi(5).isi).toBe("5 laporan menunggu verifikasi.");
  });
});
