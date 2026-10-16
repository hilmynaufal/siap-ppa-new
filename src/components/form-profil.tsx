"use client";

import { CheckCircle2, KeyRound, Save } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { gantiKataSandiAksi, ubahNamaAksi, type AksiProfil } from "@/app/profil/actions";
import { BidangForm } from "./master-ui";
import { Galat, input, tombolUtama } from "./ui-form";

function Status({ state, id }: { state: AksiProfil; id: string }) {
  return (
    <div aria-live="polite">
      {state?.ok ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-success">
          <CheckCircle2 size={16} aria-hidden="true" />
          {state.pesan}
        </p>
      ) : (
        <Galat id={id} pesan={state?.galat ? undefined : state?.pesan} />
      )}
    </div>
  );
}

export function FormNama({ nama }: { nama: string }) {
  const [state, aksi, pending] = useActionState(ubahNamaAksi, undefined as AksiProfil);
  const g = state?.galat ?? {};
  return (
    <form action={aksi} noValidate>
      <BidangForm id="nama" label="Nama lengkap" petunjuk="Tampil di kepala halaman, jadwal, dan BAP." galat={g.nama}>
        <input id="nama" name="nama" defaultValue={nama} autoComplete="name" aria-invalid={!!g.nama} aria-describedby={g.nama ? "nama-galat" : "nama-petunjuk"} className={input} />
      </BidangForm>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={tombolUtama}>
          <Save size={18} aria-hidden="true" />
          {pending ? "Menyimpan..." : "Simpan nama"}
        </button>
        <Status state={state} id="galat-nama" />
      </div>
    </form>
  );
}

export function FormKataSandi({ minimal }: { minimal: number }) {
  const [state, aksi, pending] = useActionState(gantiKataSandiAksi, undefined as AksiProfil);
  const form = useRef<HTMLFormElement>(null);
  const g = state?.galat ?? {};
  // Kata sandi tidak pernah dikembalikan ke formulir; kosongkan setelah berhasil.
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  const bidang = (id: "lama" | "baru" | "ulangi", label: string, autoComplete: string, petunjuk?: string) => (
    <BidangForm id={id} label={label} galat={g[id]} petunjuk={petunjuk}>
      <input
        id={id}
        name={id}
        type="password"
        autoComplete={autoComplete}
        aria-invalid={!!g[id]}
        aria-describedby={g[id] ? `${id}-galat` : petunjuk ? `${id}-petunjuk` : undefined}
        className={input}
      />
    </BidangForm>
  );
  return (
    <form ref={form} action={aksi} noValidate>
      {bidang("lama", "Kata sandi saat ini", "current-password")}
      {bidang("baru", "Kata sandi baru", "new-password", `Minimal ${minimal} karakter. Gunakan gabungan kata yang mudah diingat tetapi sulit ditebak.`)}
      {bidang("ulangi", "Ulangi kata sandi baru", "new-password")}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={tombolUtama}>
          <KeyRound size={18} aria-hidden="true" />
          {pending ? "Menyimpan..." : "Ganti kata sandi"}
        </button>
        <Status state={state} id="galat-sandi" />
      </div>
    </form>
  );
}
