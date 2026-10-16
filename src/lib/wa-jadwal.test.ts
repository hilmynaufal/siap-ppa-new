import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { cekTiket, hariJakarta, jadwalLaporan } from "./tiket";
import { verifikasiLaporan } from "./verifikasi";
import { KANAL_WHATSAPP, catatWaDibuka, infoWaSesi, pesanJadwalWa, tautanCekTiket } from "./wa-jadwal";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const acak = Array.from({ length: 6 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)]).join("");
const awalan = `UjiWa${acak}`;
const ASAL = "https://siap-ppa.contoh.test";
let adminId = "";
let jenisId = "";
let jenisPId = "";
let lokasiId = "";
let pendampingId = "";
const dibuat: string[] = [];
let urut = 0;
const besok = hariJakarta(new Date(Date.now() + 24 * 3600 * 1000));
const jadwal = { tanggal: besok, jamMulai: "09:00", jamSelesai: "10:00" };

async function laporanTerverifikasi(kontak: { pelapor?: string | null; korban?: string | null; sendiri?: boolean }) {
  const kode = `PPA-261016-${acak.slice(0, 5)}${"ABCDEFGHJKMNPQRSTUVWXYZ"[urut++]}`;
  const l = await db.laporan.create({
    data: {
      kodePendaftaran: kode,
      pelaporAdalahKorban: !!kontak.sendiri,
      pelapor: kontak.sendiri ? undefined : { create: { nama: "Pelapor Fiktif", kontak: kontak.pelapor ?? "" } },
      korban: { create: { nama: "Korban Fiktif", kontak: kontak.korban ?? null } },
      jenisKekerasanId: jenisId,
      kronologi: "Kronologi fiktif untuk pengujian WhatsApp.",
      persetujuanData: true,
      persetujuanPada: new Date(),
    },
  });
  dibuat.push(l.id);
  const h = await verifikasiLaporan(db, l.id, adminId, { jenisPendampingId: jenisPId, pendampingId, lokasiId, ...jadwal });
  if (!h.ok || !h.sesiId) throw new Error("verifikasi gagal");
  return { laporanId: l.id, kode, sesiId: h.sesiId };
}

beforeAll(async () => {
  adminId = (await db.pengguna.create({ data: { nama: "Admin Wa", email: `${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
  jenisId = (await db.jenisKekerasan.create({ data: { nama: `Jenis ${awalan}` } })).id;
  jenisPId = (await db.jenisPendampingan.create({ data: { kode: awalan.slice(-7), nama: `Psikologis ${awalan}` } })).id;
  lokasiId = (await db.lokasi.create({ data: { nama: `UPTD ${awalan}`, alamat: "Jl. Fiktif No. 17" } })).id;
  pendampingId = (await db.pengguna.create({ data: { nama: "Pendamping Wa", email: `p${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "PENDAMPING", jenisPendampingId: jenisPId } })).id;
});

afterAll(async () => {
  const sesi = (await db.sesi.findMany({ where: { laporanId: { in: dibuat } }, select: { id: true } })).map((s) => s.id);
  await db.logAudit.deleteMany({ where: { OR: [{ entitasId: { in: [...dibuat, ...sesi] } }, { penggunaId: adminId }] } });
  await db.notifikasi.deleteMany({ where: { sesiId: { in: sesi } } });
  await db.tiket.deleteMany({ where: { sesiId: { in: sesi } } });
  await db.sesi.deleteMany({ where: { id: { in: sesi } } });
  await db.laporan.deleteMany({ where: { id: { in: dibuat } } });
  await db.pengguna.deleteMany({ where: { id: { in: [pendampingId, adminId] } } });
  await db.lokasi.deleteMany({ where: { id: lokasiId } });
  await db.jenisPendampingan.deleteMany({ where: { id: jenisPId } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisId } });
  await db.$disconnect();
});

describe("pesan WhatsApp jadwal", () => {
  it("tautan Cek Tiket membawa kode di fragmen, bukan di query", () => {
    expect(tautanCekTiket(`${ASAL}/`, "PPA-261016-ABCDEF")).toBe(`${ASAL}/cek-tiket#kode=PPA-261016-ABCDEF`);
  });

  it("memuat kode, layanan, waktu WIB, tempat, nomor antrean, dan tautan", () => {
    const p = pesanJadwalWa({
      nama: "Ibu Sari",
      kode: "PPA-261016-ABCDEF",
      jenis: "Pendampingan psikologis",
      mulai: new Date("2026-10-20T02:00:00Z"),
      selesai: new Date("2026-10-20T03:00:00Z"),
      lokasi: "UPTD PPA",
      alamat: "Jl. Raya Soreang KM 17",
      nomorAntrean: "PSI-20261020-001",
      tautan: `${ASAL}/cek-tiket#kode=PPA-261016-ABCDEF`,
    });
    expect(p).toContain("Halo Ibu Sari");
    expect(p).toContain("PPA-261016-ABCDEF");
    expect(p).toContain("Selasa, 20 Oktober 2026");
    expect(p).toContain("09:00 - 10:00 WIB");
    expect(p).toContain("UPTD PPA, Jl. Raya Soreang KM 17");
    expect(p).toContain("PSI-20261020-001");
    expect(p).toContain(`${ASAL}/cek-tiket#kode=PPA-261016-ABCDEF`);
  });
});

describe("infoWaSesi", () => {
  it("verifikasi mengembalikan sesi; pesan ditujukan ke nomor ponsel pelapor", async () => {
    const { kode, sesiId } = await laporanTerverifikasi({ pelapor: "0812 3456 7890" });
    const info = (await infoWaSesi(db, sesiId, ASAL))!;
    expect(info).toMatchObject({ sesiId, kode, penerima: "Pelapor Fiktif", nomor: "0812 3456 7890" });
    expect(info.tautanWa).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=/);
    expect(decodeURIComponent(info.tautanWa!.split("text=")[1])).toBe(info.pesan);
    expect(info.pesan).toContain(`${ASAL}/cek-tiket#kode=${kode}`);
    expect(info.ringkas.nomorAntrean).toBeTruthy();
  });

  it("korban sendiri: ke nomor korban; nomor pelapor bukan ponsel: coba korban; tanpa ponsel: tautan kosong", async () => {
    const sendiri = await laporanTerverifikasi({ sendiri: true, korban: "081299990000" });
    expect((await infoWaSesi(db, sendiri.sesiId, ASAL))?.penerima).toBe("Korban Fiktif");

    const kantor = await laporanTerverifikasi({ pelapor: "022 5897180", korban: "085711112222" });
    const k = (await infoWaSesi(db, kantor.sesiId, ASAL))!;
    expect(k.penerima).toBe("Korban Fiktif");
    expect(k.tautanWa).toMatch(/^https:\/\/wa\.me\/6285711112222/);

    const tanpa = await laporanTerverifikasi({ pelapor: "022 5897180" });
    const t = (await infoWaSesi(db, tanpa.sesiId, ASAL))!;
    expect(t.tautanWa).toBeNull();
    expect(t.pesan).toContain(tanpa.kode);
    expect(await infoWaSesi(db, "tidak-ada", ASAL)).toBeNull();
  });

  it("pembukaan WhatsApp tercatat untuk Admin, tetapi tidak tampil sebagai pembaruan di Cek Tiket", async () => {
    const { laporanId, kode, sesiId } = await laporanTerverifikasi({ pelapor: "081211113333" });
    const info = (await infoWaSesi(db, sesiId, ASAL))!;
    await catatWaDibuka(db, sesiId, adminId, info.pesan);

    const n = await db.notifikasi.findFirstOrThrow({ where: { sesiId, kanal: KANAL_WHATSAPP } });
    expect(n).toMatchObject({ penerima: "PELAPOR", pesan: info.pesan });
    expect(n.dikirimPada).not.toBeNull();
    expect(await db.logAudit.count({ where: { entitasId: sesiId, aksi: "BUKA_WA_JADWAL", penggunaId: adminId } })).toBe(1);

    const [sesi] = await jadwalLaporan(db, laporanId);
    expect(sesi.waTerakhir).toBe(n.dibuatPada.toISOString());

    const c = await cekTiket(db, kode);
    expect(c.ok).toBe(true);
    if (c.ok) expect(c.tiket.flatMap((x) => x.pembaruan).some((p) => p.pesan === info.pesan)).toBe(false);
  });
});
