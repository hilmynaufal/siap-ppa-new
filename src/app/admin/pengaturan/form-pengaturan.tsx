"use client";

import { CheckCircle2, Save } from "lucide-react";
import { useActionState } from "react";
import { BidangForm } from "@/components/master-ui";
import { Galat, input, tombolUtama } from "@/components/ui-form";
import type { PengaturanBap } from "@/lib/pengaturan";
import { simpanPengaturan, type AksiPengaturan } from "./actions";

export function FormPengaturan({ awal }: { awal: PengaturanBap }) {
  const [state, aksi, pending] = useActionState(simpanPengaturan, undefined as AksiPengaturan);
  const g = state?.galat ?? {};
  const nilai = state?.nilai ?? awal;
  return (
    <form action={aksi} noValidate className="max-w-xl">
      <BidangForm id="kepalaUptdNama" label="Nama Kepala UPTD PPA" petunjuk="Lengkap dengan gelar, seperti yang tercetak di BAP." galat={g.kepalaUptdNama}>
        <input id="kepalaUptdNama" name="kepalaUptdNama" defaultValue={nilai.kepalaUptdNama} autoComplete="off" aria-invalid={!!g.kepalaUptdNama} className={input} />
      </BidangForm>
      <BidangForm id="kepalaUptdNip" label="NIP" petunjuk="18 digit angka." galat={g.kepalaUptdNip}>
        <input id="kepalaUptdNip" name="kepalaUptdNip" defaultValue={nilai.kepalaUptdNip} inputMode="numeric" maxLength={24} autoComplete="off" aria-invalid={!!g.kepalaUptdNip} className={input + " tabular-nums"} />
      </BidangForm>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={tombolUtama}>
          <Save size={18} aria-hidden="true" />
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
        <div aria-live="polite">
          {state?.ok ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 size={16} aria-hidden="true" />
              {state.pesan}
            </p>
          ) : (
            <Galat id="galat-pengaturan" pesan={state?.galat ? undefined : state?.pesan} />
          )}
        </div>
      </div>
    </form>
  );
}
