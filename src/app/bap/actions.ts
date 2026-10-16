"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { bolehAksesKasus, isianDariFormData, simpanDataBap, type GalatBap, type IsianBap } from "@/lib/data-bap";
import { db } from "@/lib/db";

export type AksiBap = { ok?: boolean; pesan?: string; galat?: GalatBap; nilai?: IsianBap } | undefined;

export async function lengkapiBapAksi(_s: AksiBap, fd: FormData): Promise<AksiBap> {
  const pengguna = await wajibPeran("ADMIN", "PENDAMPING");
  const laporanId = String(fd.get("laporanId") ?? "");
  if (!(await bolehAksesKasus(db, pengguna, laporanId))) return { pesan: "Anda tidak menangani kasus ini." };
  const nilai = isianDariFormData(fd);
  const h = await simpanDataBap(db, laporanId, nilai, pengguna.id);
  if (!h.ok) return { pesan: h.pesan, galat: h.galat, nilai };
  revalidatePath(`/admin/laporan/${laporanId}`);
  revalidatePath("/pendamping", "layout");
  return { ok: true, pesan: h.berubah.length ? "Data BAP tersimpan." : "Tidak ada perubahan.", nilai: { ...nilai, terlaporNik: "" } };
}
