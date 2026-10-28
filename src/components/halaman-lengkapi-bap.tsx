import { ClipboardPen } from "lucide-react";
import { IkonKotak } from "@/components/ikon-kotak";
import type { PrismaClient } from "@/generated/prisma/client";
import { isianBapAwal } from "@/lib/data-bap";
import { pilihanReferensi } from "@/lib/referensi";
import { FormLengkapiBap } from "./form-lengkapi-bap";

/** Isi halaman "Lengkapi data BAP"; dipakai area Admin dan Pendamping. Mengembalikan null bila laporan tidak ada. */
export async function HalamanLengkapiBap({ db, laporanId, kembali }: { db: PrismaClient; laporanId: string; kembali: { href: string; label: string } }) {
  const [data, pekerjaan, agama, hubungan, rujukan] = await Promise.all([
    isianBapAwal(db, laporanId),
    pilihanReferensi(db, "pekerjaan"),
    pilihanReferensi(db, "agama"),
    pilihanReferensi(db, "hubungan"),
    pilihanReferensi(db, "rujukan"),
  ]);
  if (!data) return null;
  // Pilihan yang sudah tersimpan tetap tampil walau master-nya kini nonaktif.
  const tambahTersimpan = async (daftar: { id: string; nama: string }[], ids: string[], cari: (ids: string[]) => Promise<{ id: string; nama: string }[]>) => {
    const kurang = ids.filter((id) => id && !daftar.some((d) => d.id === id));
    return kurang.length ? [...daftar, ...(await cari(kurang))] : daftar;
  };
  const i = data.isian;
  const [pkj, agm, hub, rjk] = await Promise.all([
    tambahTersimpan(pekerjaan, [i.pelaporPekerjaanId, i.terlaporPekerjaanId], (ids) => db.pekerjaan.findMany({ where: { id: { in: ids } }, select: { id: true, nama: true } })),
    tambahTersimpan(agama, [i.pelaporAgamaId, i.korbanAgamaId, i.terlaporAgamaId], (ids) => db.agama.findMany({ where: { id: { in: ids } }, select: { id: true, nama: true } })),
    tambahTersimpan(hubungan, [i.terlaporHubunganId], (ids) => db.hubunganKorban.findMany({ where: { id: { in: ids } }, select: { id: true, nama: true } })),
    tambahTersimpan(rujukan, [i.asalRujukanId], (ids) => db.asalRujukan.findMany({ where: { id: { in: ids } }, select: { id: true, nama: true } })),
  ]);

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <IkonKotak ikon={ClipboardPen} warna="green" ukuran="lg" />
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">Lengkapi data BAP</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            Laporan <span className="tabular-nums">{data.kode}</span>. Semua isian tidak wajib; yang kosong tercetak kosong di BAP. Setiap penyimpanan tercatat di log audit.
          </p>
        </div>
      </div>
      <FormLengkapiBap data={data} opsi={{ pekerjaan: pkj, agama: agm, hubungan: hub, rujukan: rjk }} kembali={kembali} />
    </>
  );
}
