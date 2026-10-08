import { Breadcrumb } from "@/components/breadcrumb";
import { DaftarReferensi } from "@/components/daftar-referensi";
import { db } from "@/lib/db";
import { daftarReferensi } from "@/lib/referensi";
import { alihkan, hapus, tambah, ubah } from "./actions";

export const metadata = { title: "Hubungan dengan Korban | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function Halaman() {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Data master" }, { label: "Hubungan dengan Korban" }]} />
      <DaftarReferensi
        judul="Hubungan dengan Korban"
        deskripsi="Pilihan hubungan pelapor dan terlapor dengan korban pada formulir laporan, mis. orang tua atau tetangga."
        ikon="hubungan"
        warna="amber"
        satuan="hubungan"
        data={await daftarReferensi(db, "hubungan")}
        tambah={tambah}
        ubah={ubah}
        hapus={hapus}
        alihkan={alihkan}
      />
    </main>
  );
}
