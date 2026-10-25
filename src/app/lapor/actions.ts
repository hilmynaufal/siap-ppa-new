"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  BIDANG_JEBAKAN,
  DOKUMEN_LAPORAN,
  bidangDokumen,
  dokumenTampil,
  dokumenWajib,
  nilaiDariFormData,
  SkemaLaporan,
  bentukDataLaporan,
  galatPerBidang,
  langkahDariBidang,
  periksaBerkas,
  type Galat,
  type Langkah,
} from "@/lib/laporan";
import { periksaPilihanLaporan, rujukanWajibSurat, simpanLaporan } from "@/lib/laporan-layanan";

export type KirimState = { galat?: Galat; ringkasan?: string; langkah?: Langkah; nilai?: Record<string, string> } | undefined;

/** Ditampilkan bila basis data sibuk atau galat tak terduga: isian tetap ada, Pelapor cukup mengirim lagi. */
const PESAN_SIBUK = "Server sedang sibuk sehingga laporan belum terkirim. Isian dan berkas Anda masih ada; tunggu sebentar lalu tekan Kirim Laporan lagi.";

/** Langkah paling awal yang berisi galat, agar Pelapor dibawa ke sana. */
function langkahPertamaBergalat(galat: Galat): Langkah {
  return Math.min(...Object.keys(galat).map(langkahDariBidang)) as Langkah;
}

export async function kirimLaporan(_s: KirimState, formData: FormData): Promise<KirimState> {
  // Isian dikembalikan ke browser pengirimnya sendiri saat ada galat, agar tidak perlu mengetik ulang.
  const nilai = nilaiDariFormData(formData);

  // Kolom jebakan untuk robot: manusia tidak melihat dan tidak mengisinya. Tidak dialihkan diam-diam,
  // agar Pelapor sungguhan yang kolomnya terisi otomatis tetap mendapat pesan dan isiannya.
  if (String(formData.get(BIDANG_JEBAKAN) ?? "") !== "") {
    console.warn("kirimLaporan: kolom jebakan terisi, laporan tidak disimpan");
    return { ringkasan: "Laporan belum dapat dikirim. Muat ulang halaman, lalu isi dan kirim kembali.", langkah: 5, nilai };
  }

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

  let kode: string;
  try {
    const data = bentukDataLaporan(hasil.data);
    // Pilihan harus benar-benar ada dan masih aktif; desa harus sesuai kecamatannya.
    const galatPilihan = await periksaPilihanLaporan(db, data);
    if (Object.keys(galatPilihan).length) {
      return { galat: galatPilihan, ringkasan: "Ada pilihan yang tidak sesuai. Silakan periksa kolom bertanda merah.", langkah: langkahPertamaBergalat(galatPilihan), nilai };
    }

    // Satu berkas per jenis dokumen; KK, KTP, dan akta kelahiran wajib; surat rujukan bila asal rujukannya mewajibkan.
    const wajibSurat = await rujukanWajibSurat(db, data.asalRujukanId);
    const berkas = [];
    for (const d of DOKUMEN_LAPORAN) {
      if (!dokumenTampil(d.jenis, !!data.asalRujukanId)) continue;
      const f = formData.get(bidangDokumen(d.jenis));
      if (!(f instanceof File) || f.size === 0) {
        if (dokumenWajib(d, wajibSurat)) return { ringkasan: `${d.label} wajib dilampirkan.`, langkah: 5, nilai };
        continue;
      }
      const g = periksaBerkas(f);
      if (g) return { ringkasan: `${d.label}: ${g}`, langkah: 5, nilai };
      berkas.push({ jenis: d.jenis, nama: f.name, bytes: new Uint8Array(await f.arrayBuffer()) });
    }

    const simpan = await simpanLaporan(db, data, berkas);
    if (!simpan.ok) return { ringkasan: simpan.pesan, langkah: 5, nilai };
    kode = simpan.kode;
  } catch (e) {
    // Mis. koneksi basis data penuh atau terputus. Isian dikembalikan agar Pelapor tidak mengulang dari awal.
    console.error("kirimLaporan gagal:", e);
    return { ringkasan: PESAN_SIBUK, langkah: 5, nilai };
  }

  // Di luar try: redirect bekerja dengan melempar, sehingga tidak boleh tertangkap di atas.
  redirect(`/lapor/berhasil?kode=${kode}`);
}
