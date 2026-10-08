import { Breadcrumb } from "@/components/breadcrumb";
import { DaftarReferensi } from "@/components/daftar-referensi";
import { db } from "@/lib/db";
import { daftarReferensi } from "@/lib/referensi";
import { alihkan, hapus, tambah, ubah } from "./actions";

export const metadata = { title: "Pekerjaan | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function Halaman() {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <Breadcrumb remah={[{ label: "Beranda", href: "/admin" }, { label: "Data master" }, { label: "Pekerjaan" }]} />
      <DaftarReferensi
        judul="Pekerjaan"
        deskripsi="Pilihan pekerjaan korban pada formulir laporan."
        ikon="pekerjaan"
        warna="sky"
        satuan="pekerjaan"
        data={await daftarReferensi(db, "pekerjaan")}
        tambah={tambah}
        ubah={ubah}
        hapus={hapus}
        alihkan={alihkan}
      />
    </main>
  );
}
