"use server";

import { revalidatePath } from "next/cache";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { tandaiDibaca } from "@/lib/jadwal";

export async function tandaiSemuaDibaca() {
  const pengguna = await wajibPeran("PENDAMPING");
  await tandaiDibaca(db, pengguna.id);
  revalidatePath("/pendamping");
}
