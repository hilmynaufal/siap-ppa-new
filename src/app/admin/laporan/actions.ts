"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { wajibPeran } from "@/lib/auth";
import { db } from "@/lib/db";
import { bukaNik, cariLaporanByNik, type HasilBukaNik, type HasilCariNik, type PihakNik } from "@/lib/nik-akses";
import { BIDANG_JADWAL, type GalatJadwal } from "@/lib/tiket";
import { setujuiUsulan, tolakUsulan } from "@/lib/laporan-pendampingan";
import { hapusPermanen, pindahkanKeSampah, pulihkanLaporan } from "@/lib/sampah";
import { batalkanSesi, tambahSesi, tutupKasus, type HasilSesi } from "@/lib/sesi";
import { tolakLaporan, verifikasiLaporan, type HasilVerifikasi } from "@/lib/verifikasi";
import { catatWaDibuka, infoWaSesi, type InfoWa } from "@/lib/wa-jadwal";

export type AksiVerifikasi =
  | { ok?: boolean; pesan?: string; alasan?: string; galat?: GalatJadwal; nilai?: Record<string, string>; wa?: InfoWa | null }
  | undefined;

function selesai(hasil: HasilVerifikasi, id: string, alasan?: string, nilai?: Record<string, string>): AksiVerifikasi {
  if (!hasil.ok) return { pesan: hasil.pesan, alasan, galat: hasil.galat, nilai };
  // Daftar dan detail membaca status dari basis data; segarkan agar langsung tampil.
  revalidatePath("/admin/laporan");
  revalidatePath(`/admin/laporan/${id}`);
  revalidatePath("/pendamping");
  return { ok: true };
}

export async function verifikasi(_s: AksiVerifikasi, fd: FormData): Promise<AksiVerifikasi> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const nilai = Object.fromEntries(BIDANG_JADWAL.map((k) => [k, String(fd.get(k) ?? "")]));
  const hasil = await verifikasiLaporan(db, id, admin.id, nilai);
  const keluaran = selesai(hasil, id, undefined, nilai);
  // Info WhatsApp untuk modal "berhasil": Admin dapat langsung mengirim jadwal dan tautan Cek Tiket.
  if (hasil.ok && hasil.sesiId) return { ...keluaran, wa: await infoWaSesi(db, hasil.sesiId, await asalAplikasi()) };
  return keluaran;
}

export async function tolak(_s: AksiVerifikasi, fd: FormData): Promise<AksiVerifikasi> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const alasan = String(fd.get("alasan") ?? "");
  return selesai(await tolakLaporan(db, id, admin.id, alasan), id, alasan);
}

/** Membuka NIK utuh (tercatat di audit). Hanya Admin. */
export async function tampilkanNik(laporanId: string, pihak: PihakNik): Promise<HasilBukaNik> {
  const admin = await wajibPeran("ADMIN");
  if (pihak !== "KORBAN" && pihak !== "PELAPOR") return { ok: false, pesan: "Pihak tidak dikenal." };
  return bukaNik(db, String(laporanId ?? ""), pihak, admin.id);
}

/** Mencari laporan lewat NIK (tercatat di audit). Hanya Admin. */
export async function cariNik(nik: string): Promise<HasilCariNik> {
  const admin = await wajibPeran("ADMIN");
  return cariLaporanByNik(db, String(nik ?? "").slice(0, 40), admin.id);
}

export type AksiSesi = { ok?: boolean; pesan?: string; galat?: GalatJadwal; alasan?: string } | undefined;

function segarkan(laporanId: string) {
  for (const p of [`/admin/laporan/${laporanId}`, "/admin/laporan", "/admin/jadwal", "/pendamping"]) revalidatePath(p, "layout");
}

function hasilSesi(h: HasilSesi, laporanId: string, alasan?: string): AksiSesi {
  if (!h.ok) return { pesan: h.pesan, galat: h.galat, alasan };
  segarkan(laporanId);
  return { ok: true };
}

/** Admin menambah sesi pendampingan pada laporan yang sama. */
export async function tambahSesiAksi(_s: AksiSesi, fd: FormData): Promise<AksiSesi> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const nilai = Object.fromEntries(BIDANG_JADWAL.map((k) => [k, String(fd.get(k) ?? "")]));
  // Bila berasal dari usulan sesi lanjutan, persetujuan dan penjadwalan terjadi dalam satu transaksi.
  const usulanId = String(fd.get("usulanId") ?? "");
  return hasilSesi(usulanId ? await setujuiUsulan(db, usulanId, admin.id, nilai) : await tambahSesi(db, id, admin.id, nilai), id);
}

/** Admin menolak usulan sesi lanjutan dari Pendamping. */
export async function tolakUsulanAksi(_s: AksiSesi, fd: FormData): Promise<AksiSesi> {
  const admin = await wajibPeran("ADMIN");
  return hasilSesi(await tolakUsulan(db, String(fd.get("usulanId") ?? ""), admin.id), String(fd.get("id") ?? ""));
}

/** Admin membatalkan sesi yang belum dimulai, dengan alasan. */
export async function batalkanSesiAksi(_s: AksiSesi, fd: FormData): Promise<AksiSesi> {
  const admin = await wajibPeran("ADMIN");
  const laporanId = String(fd.get("laporanId") ?? "");
  const alasan = String(fd.get("alasan") ?? "");
  return hasilSesi(await batalkanSesi(db, String(fd.get("sesiId") ?? ""), admin.id, alasan), laporanId, alasan);
}

/** Admin menutup kasus setelah seluruh sesi selesai. */
export async function tutupKasusAksi(_s: AksiSesi, fd: FormData): Promise<AksiSesi> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  return hasilSesi(await tutupKasus(db, id, admin.id), id);
}

/** Asal URL aplikasi untuk tautan di pesan: APP_URL bila diatur, selain itu dari permintaan yang sedang berjalan. */
async function asalAplikasi() {
  if (process.env.APP_URL) return process.env.APP_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export type HasilInfoWa = { ok: true; info: InfoWa } | { ok: false; pesan: string };

/** Pesan WhatsApp berisi jadwal sesi dan tautan Cek Tiket, untuk dikirim Admin. */
export async function infoWaAksi(sesiId: string): Promise<HasilInfoWa> {
  await wajibPeran("ADMIN");
  const info = await infoWaSesi(db, String(sesiId ?? ""), await asalAplikasi());
  return info ? { ok: true, info } : { ok: false, pesan: "Sesi tidak ditemukan." };
}

/** Dicatat saat Admin membuka WhatsApp; pesan disusun ulang di server, bukan diterima dari browser. */
export async function catatWaAksi(sesiId: string): Promise<void> {
  const admin = await wajibPeran("ADMIN");
  const info = await infoWaSesi(db, String(sesiId ?? ""), await asalAplikasi());
  if (!info) return;
  await catatWaDibuka(db, info.sesiId, admin.id, info.pesan);
  const s = await db.sesi.findUnique({ where: { id: info.sesiId }, select: { laporanId: true } });
  if (s) revalidatePath(`/admin/laporan/${s.laporanId}`);
}

export type AksiSampah = { ok?: boolean; pesan?: string } | undefined;

function segarkanSampah(id: string) {
  for (const p of ["/admin", "/admin/laporan", "/admin/sampah", `/admin/laporan/${id}`, "/admin/jadwal", "/pendamping"]) revalidatePath(p, "layout");
}

/** Memindahkan laporan ke Sampah (dapat dipulihkan). Hanya Admin; alasan wajib dan tercatat di audit. */
export async function hapusLaporanAksi(_s: AksiSampah, fd: FormData): Promise<AksiSampah> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const h = await pindahkanKeSampah(db, id, admin.id, String(fd.get("alasan") ?? ""));
  if (!h.ok) return { pesan: h.pesan };
  segarkanSampah(id);
  // Dialihkan dari server: setelah status berubah, tombol di halaman detail ikut hilang sehingga tidak bisa mengalihkan sendiri.
  redirect("/admin/laporan");
}

export async function pulihkanLaporanAksi(_s: AksiSampah, fd: FormData): Promise<AksiSampah> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const h = await pulihkanLaporan(db, id, admin.id);
  if (!h.ok) return { pesan: h.pesan };
  segarkanSampah(id);
  return { ok: true };
}

/** Hapus permanen dari Sampah. Admin harus mengetik ulang kode laporan sebagai konfirmasi. */
export async function hapusPermanenAksi(_s: AksiSampah, fd: FormData): Promise<AksiSampah> {
  const admin = await wajibPeran("ADMIN");
  const id = String(fd.get("id") ?? "");
  const l = await db.laporan.findUnique({ where: { id }, select: { kodePendaftaran: true } });
  if (!l) return { pesan: "Laporan tidak ditemukan." };
  if (String(fd.get("konfirmasi") ?? "").trim().toUpperCase() !== l.kodePendaftaran) return { pesan: `Ketik ${l.kodePendaftaran} untuk mengonfirmasi.` };
  const h = await hapusPermanen(db, id, admin.id);
  if (!h.ok) return { pesan: h.pesan };
  segarkanSampah(id);
  // Dari halaman detail, halaman itu sudah tidak ada lagi: kembali ke Sampah.
  if (fd.get("dariDetail") === "1") redirect("/admin/sampah");
  return { ok: true };
}
