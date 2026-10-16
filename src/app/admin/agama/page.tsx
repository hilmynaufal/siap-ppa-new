import { Breadcrumb } from "@/components/breadcrumb";
import { DaftarReferensi } from "@/components/daftar-referensi";
import { db } from "@/lib/db";
import { daftarReferensi } from "@/lib/referensi";
import { alihkan, hapus, tambah, ubah } from "./actions";

export const metadata = { title: "Agama | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function Halaman() {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Data master" }, { label: "Agama" }]} />
      <DaftarReferensi
        judul="Agama"
        deskripsi="Pilihan agama korban pada formulir laporan, serta pelapor dan pelaku pada data BAP."
        ikon="agama"
        warna="teal"
        satuan="agama"
        data={await daftarReferensi(db, "agama")}
        tambah={tambah}
        ubah={ubah}
        hapus={hapus}
        alihkan={alihkan}
      />
    </main>
  );
}
