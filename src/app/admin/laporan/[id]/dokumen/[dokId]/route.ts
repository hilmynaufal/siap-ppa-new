import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { responsDokumen } from "@/lib/dokumen";

/** Berkas bukti hanya dilayani lewat sini (di luar akar web) dan hanya untuk Admin. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; dokId: string }> }) {
  await wajibPeran("ADMIN");
  const { id, dokId } = await params;
  return responsDokumen(db, id, dokId);
}
