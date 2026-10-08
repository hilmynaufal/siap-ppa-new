import { BellRing, CheckCheck, ClipboardList } from "lucide-react";
import { IkonKotak } from "@/components/ikon-kotak";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifikasiPendamping } from "@/lib/jadwal";
import { daftarSesiPendamping } from "@/lib/sesi";
import { tandaiSemuaDibaca } from "./actions";
import { DaftarSesi } from "./daftar-sesi";

export const metadata = { title: "Kelola Pendampingan | SIAP PPA" };
export const dynamic = "force-dynamic";

export default async function BerandaPendamping() {
  const pengguna = await wajibPeran("PENDAMPING");
  const [sesi, notif] = await Promise.all([daftarSesiPendamping(db, pengguna.id), notifikasiPendamping(db, pengguna.id, 5)]);
  const belumDibaca = notif.filter((n) => !n.dibaca).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-center gap-4">
        <IkonKotak ikon={ClipboardList} warna="teal" ukuran="lg" />
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Kelola Pendampingan</h1>
          <p className="mt-0.5 text-sm text-ink-soft">Sesi yang ditugaskan Admin kepada Anda.</p>
        </div>
      </div>

      <DaftarSesi sesi={sesi} />

      {notif.length > 0 && (
        <section aria-labelledby="h-notif" className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="h-notif" className="flex items-center gap-2 text-lg font-bold text-navy-900">
              <BellRing size={20} aria-hidden="true" className="text-magenta-600" />
              Pemberitahuan
              {belumDibaca > 0 && (
                <span className="rounded-lg bg-magenta-600 px-2 py-0.5 text-xs font-bold text-white">{belumDibaca} baru</span>
              )}
            </h2>
            {belumDibaca > 0 && (
              <form action={tandaiSemuaDibaca}>
                <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-blue-600 hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
                  <CheckCheck size={16} aria-hidden="true" />
                  Tandai sudah dibaca
                </button>
              </form>
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {notif.map((n) => (
              <li key={n.id} className={"rounded-xl border p-4 " + (n.dibaca ? "border-line bg-surface" : "border-magenta-100 bg-magenta-100/10")}>
                <p className="break-words text-ink">{n.pesan}</p>
                <p className="mt-1 text-xs text-ink-mute">
                  {new Date(n.pada).toLocaleString("id-ID", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

    </main>
  );
}
