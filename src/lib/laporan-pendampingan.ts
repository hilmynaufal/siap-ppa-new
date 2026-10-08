import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { deteksiTipe, ekstensiUntuk } from "./laporan";
import { direktoriUnggah } from "./laporan-layanan";
import { MAKS_FOTO, MAKS_UKURAN_FOTO, SkemaLaporanPendampingan, SkemaRevisi, galatBidang, periksaFoto, type GalatPendampingan } from "./pendampingan-skema";
import { KANAL_APLIKASI } from "./jadwal";
import { tambahSesi, type HasilSesi } from "./sesi";

export type FotoMasuk = { nama: string; bytes: Uint8Array };

export type HasilLaporan = { ok: true } | { ok: false; pesan: string; galat?: GalatPendampingan };

export type FotoView = { id: string; nama: string; ukuran: number };
export type RevisiView = { versi: number; alasan: string; pada: string; oleh: string };
export type LaporanView = {
  id: string;
  sesiId: string;
  jenis: string;
  keterangan: string;
  rekomendasi: string;
  ajukanSesiLanjutan: boolean;
  statusUsulan: "MENUNGGU" | "DISETUJUI" | "DITOLAK" | null;
  versi: number;
  dikirimPada: string;
  penulis: string;
  foto: FotoView[];
  /** Riwayat dari yang terbaru: tiap versi dengan waktu kirim dan alasan revisinya (versi 1 tanpa alasan). */
  riwayat: { versi: number; pada: string; oleh: string; alasan: string | null }[];
};

const STATUS_BOLEH_LAPOR = ["BERLANGSUNG", "SELESAI"];

function adaBentrokUnik(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

const LAPORAN_INCLUDE = {
  penulis: { select: { nama: true } },
  foto: { select: { id: true, namaBerkas: true, ukuran: true }, orderBy: { namaBerkas: "asc" as const } },
  usulan: { select: { status: true } },
  revisi: { orderBy: { versi: "asc" as const }, include: { pengubah: { select: { nama: true } } } },
} satisfies Prisma.LaporanPendampinganInclude;

type BarisLaporan = Prisma.LaporanPendampinganGetPayload<{ include: typeof LAPORAN_INCLUDE }>;

function keView(l: BarisLaporan): LaporanView {
  // Baris revisi k menyimpan isi versi k sebelum diganti; waktu kirim versi k ada di salinannya.
  const kirimVersi = new Map<number, string>();
  for (const r of l.revisi) kirimVersi.set(r.versi, String((r.isiSebelumnya as { dikirimPada?: string }).dikirimPada ?? r.dibuatPada.toISOString()));
  kirimVersi.set(l.versi, (l.dikirimPada ?? l.diubahPada).toISOString());
  const alasanMasuk = new Map(l.revisi.map((r) => [r.versi + 1, { alasan: r.alasan, oleh: r.pengubah.nama }]));
  const riwayat = Array.from({ length: l.versi }, (_, i) => l.versi - i).map((v) => ({
    versi: v,
    pada: kirimVersi.get(v) ?? l.dibuatPada.toISOString(),
    oleh: alasanMasuk.get(v)?.oleh ?? l.penulis.nama,
    alasan: alasanMasuk.get(v)?.alasan ?? null,
  }));
  return {
    id: l.id,
    sesiId: l.sesiId,
    jenis: l.jenisPendampingan,
    keterangan: l.keterangan,
    rekomendasi: l.rekomendasi,
    ajukanSesiLanjutan: l.ajukanSesiLanjutan,
    statusUsulan: l.usulan?.status ?? null,
    versi: l.versi,
    dikirimPada: (l.dikirimPada ?? l.diubahPada).toISOString(),
    penulis: l.penulis.nama,
    foto: l.foto.map((f) => ({ id: f.id, nama: f.namaBerkas, ukuran: f.ukuran })),
    riwayat,
  };
}

/** Laporan terkirim satu sesi (null bila belum ada). */
export async function laporanSesi(db: PrismaClient, sesiId: string): Promise<LaporanView | null> {
  const l = await db.laporanPendampingan.findFirst({ where: { sesiId, dikirimPada: { not: null } }, include: LAPORAN_INCLUDE });
  return l ? keView(l) : null;
}

/** Semua laporan terkirim pada satu kasus, dikunci per id sesi. Dipakai Admin dan Pendamping pada kasus yang sama. */
export async function laporanKasus(db: PrismaClient, laporanId: string): Promise<Record<string, LaporanView>> {
  const rows = await db.laporanPendampingan.findMany({ where: { sesi: { laporanId }, dikirimPada: { not: null } }, include: LAPORAN_INCLUDE });
  return Object.fromEntries(rows.map((l) => [l.sesiId, keView(l)]));
}

// ------------------------------------------------------------------ foto

type FotoDiperiksa = { nama: string; bytes: Uint8Array; tipe: "image/jpeg" | "image/png" };

/** Memeriksa ulang foto di server: format, ukuran, dan isi berkas (bukan hanya nama atau tipe yang diklaim). */
function periksaSemuaFoto(foto: FotoMasuk[], batas: number): { ok: true; foto: FotoDiperiksa[] } | { ok: false; pesan: string } {
  if (foto.length > batas) return { ok: false, pesan: `Maksimal ${MAKS_FOTO} foto per laporan.` };
  const hasil: FotoDiperiksa[] = [];
  for (const f of foto) {
    const g = periksaFoto({ name: f.nama, size: f.bytes.length });
    if (g) return { ok: false, pesan: `${f.nama}: ${g}` };
    if (f.bytes.length > MAKS_UKURAN_FOTO) return { ok: false, pesan: `${f.nama}: Ukuran lebih dari 5 MB.` };
    const tipe = deteksiTipe(f.bytes);
    if (tipe !== "image/jpeg" && tipe !== "image/png") return { ok: false, pesan: `${f.nama}: Isi berkas bukan JPG atau PNG.` };
    hasil.push({ ...f, tipe });
  }
  return { ok: true, foto: hasil };
}

async function tulisFoto(sesiId: string, foto: FotoDiperiksa[], dir: string) {
  const folder = path.join(dir, "pendampingan", sesiId);
  if (foto.length) await mkdir(folder, { recursive: true });
  const ditulis: { namaBerkas: string; jalurBerkas: string; tipeMime: string; ukuran: number }[] = [];
  try {
    for (const f of foto) {
      const nama = `${randomUUID()}.${ekstensiUntuk(f.tipe)}`;
      await writeFile(path.join(/* turbopackIgnore: true */ folder, nama), f.bytes);
      ditulis.push({ namaBerkas: f.nama.slice(0, 200), jalurBerkas: path.join("pendampingan", sesiId, nama), tipeMime: f.tipe, ukuran: f.bytes.length });
    }
  } catch (e) {
    await hapusBerkas(ditulis.map((d) => d.jalurBerkas), dir);
    throw e;
  }
  return ditulis;
}

async function hapusBerkas(jalur: string[], dir: string) {
  await Promise.all(jalur.map((j) => rm(path.resolve(/* turbopackIgnore: true */ dir, j), { force: true }).catch(() => {})));
}

// ------------------------------------------------------------------ kirim dan revisi

async function resolveJenis(db: PrismaClient, id: string) {
  return db.jenisPendampingan.findFirst({ where: { id, aktif: true }, select: { nama: true } });
}

/**
 * Pendamping mengirim laporan untuk sesinya yang sedang berlangsung atau sudah selesai. Setelah dikirim laporan terkunci;
 * usulan sesi lanjutan (bila dicentang) ikut masuk ke Admin.
 */
export async function kirimLaporanPendampingan(
  db: PrismaClient,
  sesiId: string,
  pendampingId: string,
  mentah: unknown,
  foto: FotoMasuk[] = [],
  dir = direktoriUnggah(),
): Promise<HasilLaporan> {
  const h = SkemaLaporanPendampingan.safeParse(mentah);
  if (!h.success) return { ok: false, pesan: "Ada kolom wajib yang belum diisi.", galat: galatBidang(h.error) };

  const sesi = await db.sesi.findFirst({ where: { id: sesiId, pendampingId }, select: { status: true, laporan: { select: { status: true, kodePendaftaran: true } }, laporanPendampingan: { select: { id: true } } } });
  if (!sesi) return { ok: false, pesan: "Sesi tidak ditemukan." };
  if (!STATUS_BOLEH_LAPOR.includes(sesi.status)) return { ok: false, pesan: "Laporan dapat diisi setelah sesi dimulai." };
  if (sesi.laporanPendampingan) return { ok: false, pesan: "Laporan sesi ini sudah dikirim. Gunakan Ajukan revisi untuk mengoreksi." };
  if (h.data.ajukanSesiLanjutan && sesi.laporan.status === "DITUTUP") return { ok: false, pesan: "Kasus sudah ditutup, usulan sesi lanjutan tidak dapat diajukan." };
  const jenis = await resolveJenis(db, h.data.jenisPendampinganId);
  if (!jenis) return { ok: false, pesan: "Pilih jenis pendampingan dari daftar.", galat: { jenisPendampinganId: "Pilih jenis pendampingan dari daftar." } };
  const f = periksaSemuaFoto(foto, MAKS_FOTO);
  if (!f.ok) return { ok: false, pesan: f.pesan };

  const ditulis = await tulisFoto(sesiId, f.foto, dir);
  try {
    await db.$transaction(async (tx) => {
      const l = await tx.laporanPendampingan.create({
        data: {
          sesiId,
          penulisId: pendampingId,
          jenisPendampingan: jenis.nama,
          keterangan: h.data.keterangan,
          rekomendasi: h.data.rekomendasi,
          ajukanSesiLanjutan: h.data.ajukanSesiLanjutan,
          dikirimPada: new Date(),
          foto: { create: ditulis },
          ...(h.data.ajukanSesiLanjutan ? { usulan: { create: {} } } : {}),
        },
        select: { id: true },
      });
      // Isi laporan tidak ikut ke audit; hanya penanda dan jumlahnya.
      await tx.logAudit.create({
        data: { penggunaId: pendampingId, aksi: "KIRIM_LAPORAN_PENDAMPINGAN", entitas: "LaporanPendampingan", entitasId: l.id, rincian: { sesiId, foto: ditulis.length, usulan: h.data.ajukanSesiLanjutan } },
      });
    });
  } catch (e) {
    await hapusBerkas(ditulis.map((d) => d.jalurBerkas), dir);
    if (adaBentrokUnik(e)) return { ok: false, pesan: "Laporan sesi ini sudah dikirim. Muat ulang halaman." };
    throw e;
  }
  return { ok: true };
}

/**
 * Revisi laporan yang sudah terkunci. Isi sebelumnya disimpan sebagai riwayat beserta alasan; versi bertambah.
 * Foto dapat ditambah atau dibuang (`hapusFotoIds`), total tetap maksimal 5.
 */
export async function revisiLaporanPendampingan(
  db: PrismaClient,
  sesiId: string,
  pendampingId: string,
  mentah: unknown,
  fotoBaru: FotoMasuk[] = [],
  hapusFotoIds: string[] = [],
  dir = direktoriUnggah(),
): Promise<HasilLaporan> {
  const h = SkemaRevisi.safeParse(mentah);
  if (!h.success) return { ok: false, pesan: "Ada kolom wajib yang belum diisi.", galat: galatBidang(h.error) };

  const sesi = await db.sesi.findFirst({ where: { id: sesiId, pendampingId }, select: { laporan: { select: { status: true } } } });
  if (!sesi) return { ok: false, pesan: "Sesi tidak ditemukan." };
  const lama = await db.laporanPendampingan.findFirst({ where: { sesiId, dikirimPada: { not: null } }, include: { foto: true, usulan: { select: { id: true, status: true } } } });
  if (!lama) return { ok: false, pesan: "Laporan belum dikirim." };
  const jenis = await resolveJenis(db, h.data.jenisPendampinganId);
  if (!jenis) return { ok: false, pesan: "Pilih jenis pendampingan dari daftar.", galat: { jenisPendampinganId: "Pilih jenis pendampingan dari daftar." } };

  const hapus = lama.foto.filter((x) => hapusFotoIds.includes(x.id));
  const sisa = lama.foto.length - hapus.length;
  const f = periksaSemuaFoto(fotoBaru, MAKS_FOTO - sisa);
  if (!f.ok) return { ok: false, pesan: f.pesan };

  const usulanBaru = h.data.ajukanSesiLanjutan && !lama.usulan;
  if (usulanBaru && sesi.laporan.status === "DITUTUP") return { ok: false, pesan: "Kasus sudah ditutup, usulan sesi lanjutan tidak dapat diajukan." };

  const ditulis = await tulisFoto(sesiId, f.foto, dir);
  try {
    const sukses = await db.$transaction(async (tx) => {
      // Syarat versi lama mencegah dua revisi bersamaan saling menimpa.
      const { count } = await tx.laporanPendampingan.updateMany({
        where: { id: lama.id, versi: lama.versi },
        data: {
          jenisPendampingan: jenis.nama,
          keterangan: h.data.keterangan,
          rekomendasi: h.data.rekomendasi,
          // Usulan yang sudah diputuskan Admin tidak ditarik kembali.
          ajukanSesiLanjutan: lama.usulan && lama.usulan.status !== "MENUNGGU" ? true : h.data.ajukanSesiLanjutan,
          versi: lama.versi + 1,
          dikirimPada: new Date(),
        },
      });
      if (count === 0) return false;
      await tx.revisiLaporanPendampingan.create({
        data: {
          laporanPendampinganId: lama.id,
          versi: lama.versi,
          isiSebelumnya: {
            jenisPendampingan: lama.jenisPendampingan,
            keterangan: lama.keterangan,
            rekomendasi: lama.rekomendasi,
            ajukanSesiLanjutan: lama.ajukanSesiLanjutan,
            dikirimPada: (lama.dikirimPada ?? lama.diubahPada).toISOString(),
            foto: lama.foto.map((x) => ({ nama: x.namaBerkas, ukuran: x.ukuran })),
          },
          alasan: h.data.alasanRevisi,
          pengubahId: pendampingId,
        },
      });
      if (hapus.length) await tx.fotoPendampingan.deleteMany({ where: { id: { in: hapus.map((x) => x.id) }, laporanPendampinganId: lama.id } });
      if (ditulis.length) await tx.fotoPendampingan.createMany({ data: ditulis.map((d) => ({ ...d, laporanPendampinganId: lama.id })) });
      if (usulanBaru) await tx.usulanSesi.create({ data: { laporanPendampinganId: lama.id } });
      else if (!h.data.ajukanSesiLanjutan && lama.usulan?.status === "MENUNGGU") await tx.usulanSesi.delete({ where: { id: lama.usulan.id } });
      await tx.logAudit.create({
        data: {
          penggunaId: pendampingId,
          aksi: "REVISI_LAPORAN_PENDAMPINGAN",
          entitas: "LaporanPendampingan",
          entitasId: lama.id,
          rincian: { sesiId, dariVersi: lama.versi, fotoDitambah: ditulis.length, fotoDibuang: hapus.length },
        },
      });
      return true;
    });
    if (!sukses) {
      await hapusBerkas(ditulis.map((d) => d.jalurBerkas), dir);
      return { ok: false, pesan: "Laporan sudah berubah. Muat ulang halaman." };
    }
  } catch (e) {
    await hapusBerkas(ditulis.map((d) => d.jalurBerkas), dir);
    throw e;
  }
  await hapusBerkas(hapus.map((x) => x.jalurBerkas), dir);
  return { ok: true };
}

// ------------------------------------------------------------------ akses foto

/** Admin, atau Pendamping yang memegang sesi pada kasus yang sama dengan laporan pemilik foto. Mengembalikan data berkas bila boleh. */
export async function fotoUntukPengguna(db: PrismaClient, fotoId: string, pengguna: { id: string; peran: "ADMIN" | "PENDAMPING" }) {
  const foto = await db.fotoPendampingan.findUnique({
    where: { id: fotoId },
    select: { namaBerkas: true, jalurBerkas: true, tipeMime: true, laporanPendampingan: { select: { sesi: { select: { laporanId: true } } } } },
  });
  if (!foto) return null;
  if (pengguna.peran !== "ADMIN") {
    const ikut = await db.sesi.count({ where: { laporanId: foto.laporanPendampingan.sesi.laporanId, pendampingId: pengguna.id } });
    if (!ikut) return null;
  }
  return { namaBerkas: foto.namaBerkas, jalurBerkas: foto.jalurBerkas, tipeMime: foto.tipeMime };
}

// ------------------------------------------------------------------ usulan sesi lanjutan (Admin)

export type UsulanView = {
  id: string;
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
  jenis: string;
  rekomendasi: string;
  dari: string;
  urutanSesi: number;
  tanggal: string;
  /** Isian awal jadwal dari sesi asal: jenis (dicocokkan lewat nama), pendamping, dan lokasi. */
  awal: { jenisPendampingId: string; pendampingId: string; lokasiId: string };
};

export async function daftarUsulan(db: PrismaClient, laporanId: string): Promise<UsulanView[]> {
  const rows = await db.usulanSesi.findMany({
    where: { laporanPendampingan: { sesi: { laporanId } } },
    orderBy: { dibuatPada: "asc" },
    include: {
      laporanPendampingan: { select: { jenisPendampingan: true, rekomendasi: true, dikirimPada: true, penulis: { select: { nama: true } }, sesi: { select: { urutan: true, jenisPendampingId: true, pendampingId: true, lokasiId: true } } } },
    },
  });
  return rows.map((u) => {
    const l = u.laporanPendampingan;
    return {
      id: u.id,
      status: u.status,
      jenis: l.jenisPendampingan,
      rekomendasi: l.rekomendasi,
      dari: l.penulis.nama,
      urutanSesi: l.sesi.urutan,
      tanggal: (l.dikirimPada ?? u.dibuatPada).toISOString(),
      awal: { jenisPendampingId: l.sesi.jenisPendampingId, pendampingId: l.sesi.pendampingId, lokasiId: l.sesi.lokasiId },
    };
  });
}

/** Admin menyetujui usulan dan menjadwalkan sesi baru dalam satu langkah; keduanya berhasil atau tidak sama sekali. */
export async function setujuiUsulan(db: PrismaClient, usulanId: string, adminId: string, jadwalMentah: unknown, sekarang = new Date()): Promise<HasilSesi> {
  const u = await db.usulanSesi.findUnique({ where: { id: usulanId }, select: { status: true, laporanPendampingan: { select: { sesi: { select: { laporanId: true } } } } } });
  if (!u) return { ok: false, pesan: "Usulan tidak ditemukan." };
  if (u.status !== "MENUNGGU") return { ok: false, pesan: "Usulan ini sudah diputuskan." };
  return tambahSesi(db, u.laporanPendampingan.sesi.laporanId, adminId, jadwalMentah, sekarang, usulanId);
}

/** Admin menolak usulan; Pendamping pengusul diberi tahu lewat notifikasi aplikasi. */
export async function tolakUsulan(db: PrismaClient, usulanId: string, adminId: string): Promise<HasilSesi> {
  return db.$transaction(async (tx): Promise<HasilSesi> => {
    const u = await tx.usulanSesi.findUnique({
      where: { id: usulanId },
      select: { laporanPendampingan: { select: { penulisId: true, sesiId: true, sesi: { select: { laporan: { select: { kodePendaftaran: true } } } } } } },
    });
    if (!u) return { ok: false, pesan: "Usulan tidak ditemukan." };
    const { count } = await tx.usulanSesi.updateMany({ where: { id: usulanId, status: "MENUNGGU" }, data: { status: "DITOLAK", keputusanOlehId: adminId, diputuskanPada: new Date() } });
    if (count === 0) return { ok: false, pesan: "Usulan ini sudah diputuskan." };
    const l = u.laporanPendampingan;
    await tx.notifikasi.create({
      data: {
        sesiId: l.sesiId,
        penerima: "PENDAMPING",
        penerimaId: l.penulisId,
        kanal: KANAL_APLIKASI,
        dikirimPada: new Date(),
        pesan: `Usulan sesi lanjutan untuk laporan ${l.sesi.laporan.kodePendaftaran} tidak disetujui Admin.`,
      },
    });
    await tx.logAudit.create({ data: { penggunaId: adminId, aksi: "TOLAK_USULAN_SESI", entitas: "UsulanSesi", entitasId: usulanId } });
    return { ok: true };
  });
}
