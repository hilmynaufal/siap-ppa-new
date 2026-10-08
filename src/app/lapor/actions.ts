"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  MAKS_BERKAS,
  NAMA_BIDANG,
  SkemaLaporan,
  bentukDataLaporan,
  galatPerBidang,
  langkahDariBidang,
  periksaBerkas,
  type Galat,
  type Langkah,
} from "@/lib/laporan";
import { periksaPilihanLaporan, simpanLaporan } from "@/lib/laporan-layanan";

export type KirimState = { galat?: Galat; ringkasan?: string; langkah?: Langkah; nilai?: Record<string, string> } | undefined;

/** Langkah paling awal yang berisi galat, agar Pelapor dibawa ke sana. */
function langkahPertamaBergalat(galat: Galat): Langkah {
  return Math.min(...Object.keys(galat).map(langkahDariBidang)) as Langkah;
}

export async function kirimLaporan(_s: KirimState, formData: FormData): Promise<KirimState> {
  // Kolom jebakan untuk robot: manusia tidak melihat dan tidak mengisinya.
  if (String(formData.get("situs") ?? "") !== "") redirect("/");

  // Isian dikembalikan ke browser pengirimnya sendiri saat ada galat, agar tidak perlu mengetik ulang.
  const nilai = Object.fromEntries(NAMA_BIDANG.map((k) => [k, String(formData.get(k) ?? "")]));
  const hasil = SkemaLaporan.safeParse(nilai);
  const pulihkan = (v: Record<string, string>) => v;
  if (!hasil.success) {
    const galat = galatPerBidang(hasil.error);
    const n = Object.keys(galat).length;
    return {
      galat,
      ringkasan: `${n} kolom perlu dilengkapi. Perbaiki kolom bertanda merah untuk melanjutkan.`,
      langkah: langkahPertamaBergalat(galat),
      nilai: pulihkan(nilai),
    };
  }

  const data = bentukDataLaporan(hasil.data);
  // Pilihan harus benar-benar ada dan masih aktif; desa harus sesuai kecamatannya.
  const galatPilihan = await periksaPilihanLaporan(db, data);
  if (Object.keys(galatPilihan).length) {
    return { galat: galatPilihan, ringkasan: "Ada pilihan yang tidak sesuai. Silakan periksa kolom bertanda merah.", langkah: langkahPertamaBergalat(galatPilihan), nilai: pulihkan(nilai) };
  }

  const files = formData.getAll("dokumen").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAKS_BERKAS) return { ringkasan: `Maksimal ${MAKS_BERKAS} berkas.`, langkah: 5, nilai: pulihkan(nilai) };
  for (const f of files) {
    const g = periksaBerkas(f);
    if (g) return { ringkasan: `${f.name}: ${g}`, langkah: 5, nilai: pulihkan(nilai) };
  }
  const berkas = await Promise.all(files.map(async (f) => ({ nama: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })));

  const simpan = await simpanLaporan(db, data, berkas);
  if (!simpan.ok) return { ringkasan: simpan.pesan, langkah: 5, nilai: pulihkan(nilai) };

  redirect(`/lapor/berhasil?kode=${simpan.kode}`);
}
