import { KeyRound, Mail, UserRound } from "lucide-react";
import type { PenggunaAktif } from "@/lib/auth";
import { MIN_KATA_SANDI } from "@/lib/profil";
import { FormKataSandi, FormNama } from "./form-profil";
import { IkonKotak } from "./ikon-kotak";

const LABEL_PERAN = { ADMIN: "Admin", PENDAMPING: "Pendamping", PETUGAS: "Petugas" } as const;

/** Isi halaman Profil, sama untuk semua peran. */
export function HalamanProfil({ pengguna }: { pengguna: PenggunaAktif }) {
  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <IkonKotak ikon={UserRound} warna="sky" ukuran="lg" />
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">Profil saya</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {LABEL_PERAN[pengguna.peran]} · Perubahan tercatat di log audit.
          </p>
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="h-data-diri" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
          <h2 id="h-data-diri" className="mb-4 text-lg font-bold text-brand-900">
            Data akun
          </h2>
          <FormNama nama={pengguna.nama} />
          <div className="mt-6 flex items-start gap-3 border-t border-line-soft pt-5">
            <IkonKotak ikon={Mail} warna="navy" ukuran="sm" />
            <div>
              <p className="text-sm font-bold text-ink">Email untuk masuk</p>
              <p className="break-all text-ink">{pengguna.email}</p>
              <p className="mt-1 text-sm text-ink-mute">
                {pengguna.peran === "ADMIN"
                  ? "Email akun Admin diubah oleh pengelola server, karena akun Admin dibuat lewat skrip di server."
                  : "Email hanya dapat diubah oleh Admin lewat pengelolaan akun."}
              </p>
            </div>
          </div>
        </section>
        <section aria-labelledby="h-sandi" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
          <div className="mb-4 flex items-center gap-3">
            <IkonKotak ikon={KeyRound} warna="amber" />
            <h2 id="h-sandi" className="text-lg font-bold text-brand-900">
              Ganti kata sandi
            </h2>
          </div>
          <FormKataSandi minimal={MIN_KATA_SANDI} />
        </section>
      </div>
    </>
  );
}
