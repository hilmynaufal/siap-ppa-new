import { Breadcrumb } from "@/components/breadcrumb";
import { DaftarReferensi } from "@/components/daftar-referensi";
import { db } from "@/lib/db";
import { daftarReferensi } from "@/lib/referensi";
import { alihkan, hapus, tambah, ubah } from "./actions";

export const metadata = { title: "Asal Rujukan | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function Halaman() {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Data master" }, { label: "Asal Rujukan" }]} />
      <DaftarReferensi
        judul="Asal Rujukan"
        deskripsi="Pilihan Dirujuk dari pada formulir laporan. Asal yang wajib surat meminta Pelapor melampirkan surat rujukan."
        ikon="rujukan"
        warna="violet"
        satuan="asal rujukan"
        data={await daftarReferensi(db, "rujukan")}
        tambah={tambah}
        ubah={ubah}
        hapus={hapus}
        alihkan={alihkan}
        pakaiWajibSurat
      />
    </main>
  );
}
