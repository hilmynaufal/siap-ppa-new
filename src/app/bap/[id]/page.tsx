import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { wajibPeran } from "@/lib/auth";
import { muatBap, type DataBap, type DiriBap } from "@/lib/bap";
import { bolehAksesKasus } from "@/lib/data-bap";
import { db } from "@/lib/db";
import { KopUptd } from "@/components/kop-uptd";
import { LampiranPdf } from "./lampiran-pdf";
import { TombolCetak } from "./tombol-cetak";
import "./bap.css";

export const metadata = { title: "Berita Acara Pelaporan | SIAP PPA" };
export const dynamic = "force-dynamic";

/** Kotak centang cetak; tercentang bila `on`. */
function Centang({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span className="bap-centang">
      <span className="bap-kotak" aria-hidden="true">
        {on ? "✓" : ""}
      </span>
      <span className={on ? "bap-terpilih" : undefined}>{children}</span>
      {on && <span className="sr-only"> (dipilih)</span>}
    </span>
  );
}

function Isian({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="bap-isian">
      <span className="bap-label">{label}</span>
      <span className="bap-titik">:</span>
      <span className="bap-nilai">{nilai}</span>
    </div>
  );
}

function DataDiri({ d, panggilan = true, nikLabel = "No. Identitas (NIK)", statusPernikahan = true }: { d: DiriBap | null; panggilan?: boolean; nikLabel?: string; statusPernikahan?: boolean }) {
  const x = d ?? ({} as Partial<DiriBap>);
  return (
    <>
      <Isian label="Nama Lengkap" nilai={x.nama ?? ""} />
      {panggilan && <Isian label="Nama Panggilan" nilai={x.namaPanggilan ?? ""} />}
      <Isian label={nikLabel} nilai={x.nik ?? ""} />
      <Isian label="TTL" nilai={x.ttl ?? ""} />
      <Isian label="Usia" nilai={x.usia ?? ""} />
      <Isian label="Pekerjaan" nilai={x.pekerjaan ?? ""} />
      <Isian label="Pendidikan" nilai={x.pendidikan ?? ""} />
      <Isian label="Agama" nilai={x.agama ?? ""} />
      {statusPernikahan && <Isian label="Status Pernikahan" nilai={x.statusPerkawinan ?? ""} />}
    </>
  );
}

function JenisKelamin({ b, nilai }: { b: DataBap; nilai: string | null | undefined }) {
  return (
    <div className="bap-grup">
      <p className="bap-judul-kecil">JENIS KELAMIN</p>
      <div className="bap-pilihan bap-pilihan-1">
        {b.pilihan.jenisKelamin.map((j) => (
          <Centang key={j.nilai} on={nilai === j.nilai}>
            {j.label}
          </Centang>
        ))}
      </div>
    </div>
  );
}

export default async function HalamanBap({ params }: { params: Promise<{ id: string }> }) {
  const pengguna = await wajibPeran("ADMIN", "PENDAMPING");
  const { id } = await params;
  // Pendamping hanya untuk kasus yang ditanganinya; selain itu 404 (tidak membocorkan keberadaan laporan).
  if (!(await bolehAksesKasus(db, pengguna, id))) notFound();
  const b = await muatBap(db, id, pengguna.id);
  if (!b) notFound();

  return (
    <div className="bap-latar">
      <div className="bap-alat">
        <p>
          Dokumen ini memuat NIK utuh dan bersifat rahasia. Pembukaan BAP tercatat di log audit. Gunakan <strong>Cetak</strong>, lalu pilih{" "}
          <strong>Simpan sebagai PDF</strong> untuk menyimpan berkas (ukuran kertas Legal).
        </p>
        <TombolCetak />
      </div>

      <article className="bap-kertas" aria-label={`Berita Acara Pelaporan ${b.kode}`}>
        <KopUptd />
        <h1 className="bap-judul">BERITA ACARA PELAPORAN</h1>
        <p className="bap-noreg">No. Registrasi : {b.kode}</p>

        <table className="bap-tabel">
          <tbody>
            <tr>
              <td>
                <p className="bap-judul-kecil">Nama Penerima Pengaduan</p>
                <p>{b.penerima}</p>
              </td>
              <td>
                <Isian label="Hari/Tanggal" nilai={b.hariTanggal} />
                <Isian label="Jam" nilai={b.jam} />
              </td>
            </tr>
            <tr>
              <td>
                <p className="bap-judul-kecil">NAMA PELAPOR</p>
                <p>{b.pelapor?.nama ?? ""}</p>
              </td>
              <td>
                <JenisKelamin b={b} nilai={b.pelapor?.jenisKelamin} />
              </td>
            </tr>
            <tr>
              <td>
                <p className="bap-judul-kecil">ALAMAT LENGKAP PELAPOR</p>
                <Isian label="KTP" nilai={b.pelapor?.alamatKtp ?? ""} />
                <Isian label="Domisili" nilai={b.pelapor?.domisili ?? ""} />
                <Isian label="HP" nilai={b.pelapor?.hp ?? ""} />
                <div className="bap-jarak" />
                <DataDiri d={b.pelapor} panggilan={false} />
              </td>
              <td>
                <p className="bap-judul-kecil">RELASI PELAPOR-KORBAN</p>
                <div className="bap-pilihan bap-pilihan-2">
                  <Centang on={b.pelaporAdalahKorban}>Korban</Centang>
                  {b.pilihan.hubungan.map((h) => (
                    <Centang key={h.id} on={b.relasiPelaporId === h.id}>
                      {h.nama}
                    </Centang>
                  ))}
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <p className="bap-judul-kecil">DATA KORBAN</p>
                <DataDiri d={b.korban} />
              </td>
              <td>
                <p className="bap-judul-kecil">ALAMAT KORBAN</p>
                <Isian label="KTP" nilai={b.korban?.alamatKtp ?? ""} />
                <Isian label="Domisili" nilai={b.korban?.domisili ?? ""} />
                <Isian label="HP" nilai={b.korban?.hp ?? ""} />
                <Isian label="No BPJS" nilai={b.noBpjs} />
                <Isian label="Status BPJS" nilai={b.statusBpjs} />
                <div className="bap-jarak" />
                <JenisKelamin b={b} nilai={b.korban?.jenisKelamin} />
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <p className="bap-judul-kecil">Hubungan korban dengan pelaku</p>
                <div className="bap-pilihan bap-pilihan-3">
                  {b.pilihan.hubungan.map((h) => (
                    <Centang key={h.id} on={b.hubunganPelakuId === h.id}>
                      {h.nama}
                    </Centang>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Halaman 2: data pelaku (tanpa kop). */}
        <table className="bap-tabel bap-halaman-baru">
          <tbody>
            <tr>
              <td>
                <p className="bap-judul-kecil">DATA PELAKU</p>
                <DataDiri d={b.pelaku} nikLabel="No. Identitas" statusPernikahan={false} />
              </td>
              <td>
                <p className="bap-judul-kecil">ALAMAT PELAKU</p>
                <Isian label="KTP" nilai={b.pelaku?.alamatKtp ?? ""} />
                <div className="bap-jarak" />
                <JenisKelamin b={b} nilai={b.pelaku?.jenisKelamin} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Halaman 3: jenis kekerasan sampai tanda tangan (tanpa kop). */}
        <table className="bap-tabel bap-halaman-baru">
          <tbody>
            <tr>
              <td colSpan={2}>
                <p className="bap-judul-kecil">JENIS KEKERASAN</p>
                <div className="bap-pilihan bap-pilihan-2">
                  {b.pilihan.jenisKekerasan.map((j) => (
                    <Centang key={j.id} on={b.jenisKekerasanId === j.id}>
                      {j.nama.toUpperCase()}
                    </Centang>
                  ))}
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <p className="bap-judul-kecil">KRONOLOGIS KASUS</p>
                <p className="bap-catatan">(tempat, waktu, pihak yang terlibat, latar belakang masalah, bentuk dan dampak kekerasan)</p>
                <Isian label="TKP" nilai={b.tkp} />
                <Isian label="TANGGAL KEJADIAN" nilai={b.tanggalKejadian} />
                <Isian label="DIRUJUK DARI" nilai={b.asalRujukan} />
                <p className="bap-label">KRONOLOGIS :</p>
                <p className="bap-kronologi">{b.kronologi}</p>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <p className="bap-judul-kecil">KEBUTUHAN KORBAN/PENGADU :</p>
                {b.kebutuhan.length ? (
                  <ul className="bap-daftar">
                    {b.kebutuhan.map((k) => (
                      <li key={k}>{k}</li>
                    ))}
                  </ul>
                ) : null}
              </td>
            </tr>
            <tr>
              <td>
                <p className="bap-judul-kecil">LEMBAGA RUJUKAN</p>
                <p className="bap-kronologi">{b.lembagaRujukan}</p>
              </td>
              <td>
                <p className="bap-judul-kecil">ALASAN</p>
                <p className="bap-kronologi">{b.alasanRujukan}</p>
              </td>
            </tr>
            {/* Tanda tangan ikut dalam tabel, mengikuti format BAP. */}
            <tr className="bap-ttd">
              <td>
                <p className="bap-judul-kecil">PENERIMA LAPORAN</p>
                <p>({b.penerima || "............................................"})</p>
              </td>
              <td>
                <p className="bap-judul-kecil">PELAPOR</p>
                <p>({b.pelapor?.nama || "............................................"})</p>
              </td>
            </tr>
            <tr className="bap-ttd bap-ttd-kepala">
              <td colSpan={2}>
                <p className="bap-judul-kecil">KEPALA UPTD PPA</p>
                <div>
                  <p className="bap-garis">{b.pengaturan.kepalaUptdNama || "(nama Kepala UPTD belum diatur)"}</p>
                  <p>NIP. {b.pengaturan.kepalaUptdNip || "...................."}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Lampiran: setiap dokumen pendukung di halamannya sendiri; PDF digambar per halaman. */}
        {b.lampiran.map((d, i) => {
          const judul = `LAMPIRAN ${i + 1}: ${d.label.toUpperCase()}`;
          const src = `/bap/${id}/dokumen/${d.id}`;
          return (
            <section key={d.id} className="bap-lampiran bap-halaman-baru" aria-label={judul}>
              <p className="bap-judul-kecil">{judul}</p>
              <p className="bap-catatan">
                Laporan {b.kode} · {d.namaBerkas}
              </p>
              {d.pdf ? (
                <LampiranPdf src={src} judul={judul} />
              ) : (
                <figure className="bap-lampiran-halaman">
                  {/* eslint-disable-next-line @next/next/no-img-element -- berkas privat lewat rute berizin, dicetak apa adanya */}
                  <img src={src} alt={`${d.label}: ${d.namaBerkas}`} className="bap-lampiran-gambar" />
                </figure>
              )}
            </section>
          );
        })}
      </article>
    </div>
  );
}
