"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Langkah1,
  Langkah2,
  MAKS_BERKAS,
  NAMA_BIDANG,
  SkemaLaporan,
  galatPerBidang,
  periksaBerkas,
  type Galat,
} from "@/lib/laporan";
import { simpanLaporan } from "@/lib/laporan-layanan";

export type KirimState =
  | { galat?: Galat; ringkasan?: string; langkah?: 1 | 2 | 3; nilai?: Record<string, string> }
  | undefined;

function langkahPertamaBergalat(galat: Galat): 1 | 2 | 3 {
  const bidang = Object.keys(galat);
  if (bidang.some((b) => b in Langkah1.shape)) return 1;
  if (bidang.some((b) => b in Langkah2.shape)) return 2;
  return 3;
}

export async function kirimLaporan(_s: KirimState, formData: FormData): Promise<KirimState> {
  // Kolom jebakan untuk robot: manusia tidak melihat dan tidak mengisinya.
  if (String(formData.get("situs") ?? "") !== "") redirect("/");

  const nilai = Object.fromEntries(NAMA_BIDANG.map((k) => [k, String(formData.get(k) ?? "")]));
  const hasil = SkemaLaporan.safeParse(nilai);
  if (!hasil.success) {
    const galat = galatPerBidang(hasil.error);
    const n = Object.keys(galat).length;
    return {
      galat,
      ringkasan: `${n} kolom perlu dilengkapi. Perbaiki kolom bertanda merah untuk melanjutkan.`,
      langkah: langkahPertamaBergalat(galat),
      nilai,
    };
  }

  // Pilihan harus benar-benar ada; jenis kekerasan harus yang masih aktif.
  const [jenis, kecamatan] = await Promise.all([
    db.jenisKekerasan.findFirst({ where: { id: hasil.data.jenisKekerasanId, aktif: true }, select: { id: true } }),
    db.kecamatan.findUnique({ where: { id: hasil.data.kecamatanId }, select: { id: true } }),
  ]);
  const galat: Galat = {};
  if (!jenis) galat.jenisKekerasanId = "Pilih jenis kekerasan dari daftar.";
  if (!kecamatan) galat.kecamatanId = "Pilih kecamatan dari daftar.";
  if (Object.keys(galat).length) {
    return { galat, ringkasan: "Pilihan Anda tidak dikenali. Silakan pilih ulang.", langkah: 2, nilai };
  }

  const files = formData.getAll("dokumen").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAKS_BERKAS) return { ringkasan: `Maksimal ${MAKS_BERKAS} berkas.`, langkah: 3, nilai };
  for (const f of files) {
    const g = periksaBerkas(f);
    if (g) return { ringkasan: `${f.name}: ${g}`, langkah: 3, nilai };
  }
  const berkas = await Promise.all(files.map(async (f) => ({ nama: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })));

  const simpan = await simpanLaporan(db, hasil.data, berkas);
  if (!simpan.ok) return { ringkasan: simpan.pesan, langkah: 3, nilai };

  redirect(`/lapor/berhasil?kode=${simpan.kode}`);
}
