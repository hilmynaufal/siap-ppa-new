import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import {
  aturUlangKataSandi,
  buatKataSandiSementara,
  daftarPendamping,
  hapusJenisPendampingan,
  hapusLokasi,
  tambahJenisPendampingan,
  tambahLokasi,
  tambahPendamping,
  ubahJenisPendampingan,
  ubahLokasi,
  ubahPendamping,
} from "./master-layanan";
import { verifyPassword } from "./password";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const acak = Array.from({ length: 5 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)]).join("");
const awalan = `UjiML ${acak}`;

afterAll(async () => {
  await db.pengguna.deleteMany({ where: { email: { contains: acak.toLowerCase() } } });
  await db.jenisPendampingan.deleteMany({ where: { nama: { startsWith: awalan } } });
  await db.lokasi.deleteMany({ where: { nama: { startsWith: awalan } } });
  await db.$disconnect();
});

describe("jenis pendampingan", () => {
  it("kode dinormalisasi, nama dan kode unik, validasi bentuk kode", async () => {
    expect(await tambahJenisPendampingan(db, { kode: "a b", nama: `${awalan} A` })).toMatchObject({ ok: false, galat: { kode: expect.any(String) } });
    expect(await tambahJenisPendampingan(db, { kode: `x${acak.slice(0, 3)}`, nama: `${awalan} A` })).toEqual({ ok: true });
    const j = await db.jenisPendampingan.findFirstOrThrow({ where: { nama: `${awalan} A` } });
    expect(j.kode).toBe(`X${acak.slice(0, 3)}`);
    expect(await tambahJenisPendampingan(db, { kode: `Z${acak.slice(0, 3)}`, nama: `${awalan.toLowerCase()} a` })).toMatchObject({ ok: false, galat: { nama: expect.stringContaining("sudah ada") } });
    expect(await tambahJenisPendampingan(db, { kode: j.kode.toLowerCase(), nama: `${awalan} B` })).toMatchObject({ ok: false, galat: { kode: expect.stringContaining("sudah dipakai") } });
  });

  it("ubah, nonaktifkan, dan hapus hanya bila belum dipakai", async () => {
    const j = await db.jenisPendampingan.findFirstOrThrow({ where: { nama: `${awalan} A` } });
    expect(await ubahJenisPendampingan(db, j.id, { kode: j.kode, nama: `${awalan} A2` }, false)).toEqual({ ok: true });
    expect(await db.jenisPendampingan.findUniqueOrThrow({ where: { id: j.id } })).toMatchObject({ nama: `${awalan} A2`, aktif: false });
    const email = `pakai-${acak.toLowerCase()}@contoh.test`;
    await db.pengguna.create({ data: { nama: "Pendamping Pakai", email, kataSandiHash: "x", peran: "PENDAMPING", jenisPendampingId: j.id } });
    expect(await hapusJenisPendampingan(db, j.id)).toMatchObject({ ok: false, pesan: expect.stringContaining("tidak dapat dihapus") });
    await db.pengguna.deleteMany({ where: { email } });
    expect(await hapusJenisPendampingan(db, j.id)).toEqual({ ok: true });
    expect(await hapusJenisPendampingan(db, j.id)).toMatchObject({ ok: false });
  });
});

describe("lokasi", () => {
  it("tambah, duplikat tanpa peduli huruf besar, ubah, hapus", async () => {
    expect(await tambahLokasi(db, { nama: `${awalan} Lok`, alamat: "Jl. Fiktif No. 9" })).toEqual({ ok: true });
    expect(await tambahLokasi(db, { nama: `${awalan.toUpperCase()} LOK`, alamat: "Jl. Lain 1" })).toMatchObject({ ok: false, galat: { nama: expect.any(String) } });
    expect(await tambahLokasi(db, { nama: "", alamat: "x" })).toMatchObject({ ok: false, galat: { nama: expect.any(String), alamat: expect.any(String) } });
    const l = await db.lokasi.findFirstOrThrow({ where: { nama: `${awalan} Lok` } });
    expect(await ubahLokasi(db, l.id, { nama: `${awalan} Lok 2`, alamat: "Jl. Fiktif No. 10" }, true)).toEqual({ ok: true });
    expect(await hapusLokasi(db, l.id)).toEqual({ ok: true });
  });
});

describe("akun Pendamping", () => {
  it("membuat akun dengan kata sandi sementara yang valid untuk masuk, email unik, bidang wajib", async () => {
    const j = await db.jenisPendampingan.create({ data: { kode: `P${acak.slice(0, 3)}`, nama: `${awalan} Bidang` } });
    const email = ` Nama.${acak}@Contoh.TEST `;
    expect(await tambahPendamping(db, { nama: "Pendamping Uji ML", email: "bukan-email", jenisPendampingId: j.id })).toMatchObject({ ok: false, galat: { email: expect.any(String) } });
    expect(await tambahPendamping(db, { nama: "Pendamping Uji ML", email, jenisPendampingId: "" })).toMatchObject({ ok: false, galat: { jenisPendampingId: expect.any(String) } });
    const h = await tambahPendamping(db, { nama: "Pendamping Uji ML", email, jenisPendampingId: j.id });
    const sandi = h.ok ? h.kataSandi! : "";
    expect(sandi).toMatch(/^[A-Za-z2-9]{14}$/);
    const u = await db.pengguna.findUniqueOrThrow({ where: { email: `nama.${acak.toLowerCase()}@contoh.test` } });
    expect(u).toMatchObject({ peran: "PENDAMPING", aktif: true, jenisPendampingId: j.id });
    expect(u.kataSandiHash).not.toContain(sandi);
    expect(await verifyPassword(sandi, u.kataSandiHash)).toBe(true);
    expect(await tambahPendamping(db, { nama: "Lain", email: email.toUpperCase(), jenisPendampingId: j.id })).toMatchObject({ ok: false, galat: { email: expect.stringContaining("sudah terdaftar") } });

    // ubah + nonaktifkan; atur ulang kata sandi membuat sandi lama tidak berlaku
    expect(await ubahPendamping(db, u.id, { nama: "Pendamping Uji ML 2", email: u.email, jenisPendampingId: j.id }, false)).toEqual({ ok: true });
    expect((await db.pengguna.findUniqueOrThrow({ where: { id: u.id } })).aktif).toBe(false);
    const baru = await aturUlangKataSandi(db, u.id);
    const sandiBaru = baru.ok ? baru.kataSandi! : "";
    expect(sandiBaru).toBeTruthy();
    const setelah = await db.pengguna.findUniqueOrThrow({ where: { id: u.id } });
    expect(await verifyPassword(sandi, setelah.kataSandiHash)).toBe(false);
    expect(await verifyPassword(sandiBaru, setelah.kataSandiHash)).toBe(true);

    const daftar = await daftarPendamping(db);
    expect(daftar.find((d) => d.id === u.id)).toMatchObject({ nama: "Pendamping Uji ML 2", bidang: `${awalan} Bidang`, aktif: false, sesiTerjadwal: 0 });
    // Admin tidak muncul dan tidak bisa diatur lewat fungsi Pendamping
    const admin = await db.pengguna.create({ data: { nama: "Admin ML", email: `admin-${acak.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } });
    expect(daftar.some((d) => d.id === admin.id)).toBe(false);
    expect(await aturUlangKataSandi(db, admin.id)).toMatchObject({ ok: false });
    await db.pengguna.deleteMany({ where: { id: admin.id } });
  });

  it("kata sandi sementara acak dan tanpa karakter yang mudah tertukar", () => {
    const a = buatKataSandiSementara();
    expect(a).toHaveLength(14);
    expect(a).not.toMatch(/[01OIl]/);
    expect(buatKataSandiSementara()).not.toBe(a);
  });
});
