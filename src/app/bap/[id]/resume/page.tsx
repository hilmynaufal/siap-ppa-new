import { notFound } from "next/navigation";
import { wajibPeran } from "@/lib/auth";
import { bolehAksesKasus } from "@/lib/data-bap";
import { db } from "@/lib/db";
import { muatResume } from "@/lib/resume-pendampingan";
import { TombolCetak } from "../tombol-cetak";
import "./resume.css";

export const metadata = { title: "Resume Pendampingan | SIAP PPA" };
export const dynamic = "force-dynamic";

/** Resume pendampingan satu jenis untuk satu kasus; dicetak Admin atau Pendamping kasus (aturan sama dengan BAP). */
export default async function HalamanResume({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ jenis?: string }> }) {
  const pengguna = await wajibPeran("ADMIN", "PENDAMPING");
  const { id } = await params;
  const { jenis } = await searchParams;
  if (!(await bolehAksesKasus(db, pengguna, id))) notFound();
  const r = await muatResume(db, id, jenis, pengguna.id);
  if (!r) notFound();

  return (
    <div className="rsm-latar">
      <div className="rsm-alat">
        <p>
          Memuat identitas korban dan bersifat rahasia; pembukaan tercatat di log audit. Kolom paraf diisi tangan setelah dicetak.
        </p>
        {r.daftarJenis.length > 1 && (
          <nav aria-label="Jenis pendampingan" className="rsm-jenis">
            {r.daftarJenis.map((j) => (
              <a key={j.id} href={`/bap/${id}/resume?jenis=${j.id}`} aria-current={j.id === r.jenis?.id ? "true" : undefined}>
                {j.nama}
              </a>
            ))}
          </nav>
        )}
        <TombolCetak />
      </div>

      <article className="rsm-kertas" aria-label={`${r.judul} ${r.kode}`}>
        <h1 className="rsm-judul">{r.judul}</h1>
        <dl className="rsm-identitas">
          {(
            [
              ["NO REGISTRASI", r.kode],
              ["NAMA KLIEN", r.klien.nama],
              ["USIA", r.klien.usia],
              ["TEMPAT TANGGAL LAHIR", r.klien.ttl],
              ["ALAMAT", r.klien.alamat],
              ["JENIS KEKERASAN", r.jenisKekerasan],
              ["RUJUKAN (jika ada)", r.rujukan],
            ] as const
          ).map(([label, nilai]) => (
            <div key={label} className="contents">
              <dt>{label}</dt>
              <dt aria-hidden="true">:</dt>
              <dd>{nilai}</dd>
            </div>
          ))}
        </dl>

        <table className="rsm-tabel">
          <thead>
            <tr>
              <th scope="col" className="rsm-no">NO</th>
              <th scope="col" className="rsm-tanggal">TANGGAL</th>
              <th scope="col">URAIAN/KETERANGAN</th>
              <th scope="col" className="rsm-paraf">PARAF</th>
            </tr>
          </thead>
          <tbody>
            {r.baris.map((b) => (
              <tr key={b.no}>
                <td className="rsm-no">{b.no}</td>
                <td>{b.tanggal}</td>
                <td className="rsm-uraian">
                  {b.tidakHadir ? (
                    <p>Klien tidak hadir.</p>
                  ) : (
                    <>
                      <p>
                        <span className="rsm-sub">Keterangan: </span>
                        {b.keterangan}
                      </p>
                      <p>
                        <span className="rsm-sub">Rekomendasi: </span>
                        {b.rekomendasi}
                      </p>
                    </>
                  )}
                </td>
                <td />
              </tr>
            ))}
            {/* Sisa ruang kosong seperti format kertas, untuk catatan tangan. */}
            <tr className={r.baris.length === 0 ? "rsm-kosong" : "rsm-sisa"}>
              <td className="rsm-no" />
              <td />
              <td className="rsm-uraian">{r.baris.length === 0 && <p>Belum ada sesi selesai dengan laporan terkirim.</p>}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </article>
    </div>
  );
}
