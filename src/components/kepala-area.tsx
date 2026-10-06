import { keluar } from "@/app/masuk/actions";

export function KepalaArea({ nama, peran }: { nama: string; peran: string }) {
  return (
    <header className="flex items-center justify-between border-b border-[#DEDBE8] bg-white px-8 py-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5847C2] text-xs font-extrabold text-white">
          PPA
        </span>
        <div>
          <p className="font-bold leading-tight">SIAP PPA</p>
          <p className="text-sm text-[#66637A]">{peran}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold">{nama}</span>
        <form action={keluar}>
          <button
            type="submit"
            className="h-10 rounded-[10px] border border-[#CFCBDD] px-4 text-sm font-bold hover:bg-[#F7F6FB] focus:outline-none focus:ring-[3px] focus:ring-[#D9D3F7]"
          >
            Keluar
          </button>
        </form>
      </div>
    </header>
  );
}
