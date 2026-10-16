import { wajibPeran } from "@/lib/auth";
import { bolehAksesKasus } from "@/lib/data-bap";
import { db } from "@/lib/db";
import { responsDokumen } from "@/lib/dokumen";

/** Dokumen untuk halaman lampiran BAP: Admin, atau Pendamping yang menangani kasusnya. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; dokId: string }> }) {
  const pengguna = await wajibPeran("ADMIN", "PENDAMPING");
  const { id, dokId } = await params;
  if (!(await bolehAksesKasus(db, pengguna, id))) return new Response("Berkas tidak ditemukan.", { status: 404 });
  return responsDokumen(db, id, dokId);
}
