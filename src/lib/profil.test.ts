import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword, verifyPassword } from "./password";
import { gantiKataSandiSendiri, ubahNamaSendiri } from "./profil";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const awalan = `UjiProfil${Date.now().toString(36)}`;
// Kata sandi uji fiktif, hanya untuk tes ini.
const SANDI_LAMA = "sandi-lama-uji-123";
const SANDI_BARU = "sandi-baru-uji-456";
let id = "";

beforeAll(async () => {
  id = (await db.pengguna.create({ data: { nama: "Admin Uji Profil", email: `${awalan.toLowerCase()}@contoh.test`, kataSandiHash: await hashPassword(SANDI_LAMA), peran: "ADMIN" } })).id;
});

afterAll(async () => {
  await db.logAudit.deleteMany({ where: { penggunaId: id } });
  await db.pengguna.deleteMany({ where: { id } });
  await db.$disconnect();
});

describe("ubahNamaSendiri", () => {
  it("menyimpan nama baru dan mencatat audit; nama terlalu pendek ditolak", async () => {
    const salah = await ubahNamaSendiri(db, id, { nama: " A " });
    expect(salah).toMatchObject({ ok: false, galat: { nama: expect.stringContaining("minimal 3") } });

    expect(await ubahNamaSendiri(db, id, { nama: "  Rina Kusuma, S.Psi.  " })).toEqual({ ok: true });
    expect((await db.pengguna.findUniqueOrThrow({ where: { id } })).nama).toBe("Rina Kusuma, S.Psi.");
    const audit = await db.logAudit.findFirstOrThrow({ where: { penggunaId: id, aksi: "UBAH_PROFIL" } });
    expect(audit.rincian).toEqual({ nama: { dari: "Admin Uji Profil", ke: "Rina Kusuma, S.Psi." } });

    // Nama yang sama tidak menulis audit lagi.
    await ubahNamaSendiri(db, id, { nama: "Rina Kusuma, S.Psi." });
    expect(await db.logAudit.count({ where: { penggunaId: id, aksi: "UBAH_PROFIL" } })).toBe(1);
  });
});

describe("gantiKataSandiSendiri", () => {
  it("menolak kata sandi baru yang pendek, sama dengan lama, atau tidak cocok diulang", async () => {
    const h = await gantiKataSandiSendiri(db, id, { lama: SANDI_LAMA, baru: "pendek", ulangi: "lain" });
    expect(h).toMatchObject({ ok: false, galat: { baru: expect.stringContaining("minimal 12"), ulangi: expect.any(String) } });
    const sama = await gantiKataSandiSendiri(db, id, { lama: SANDI_LAMA, baru: SANDI_LAMA, ulangi: SANDI_LAMA });
    expect(sama).toMatchObject({ ok: false, galat: { baru: expect.stringContaining("berbeda") } });
  });

  it("menolak kata sandi lama yang salah dan mencatat percobaannya", async () => {
    const h = await gantiKataSandiSendiri(db, id, { lama: "bukan-sandinya-123", baru: SANDI_BARU, ulangi: SANDI_BARU });
    expect(h).toMatchObject({ ok: false, galat: { lama: "Kata sandi saat ini salah." } });
    expect(await db.logAudit.count({ where: { penggunaId: id, aksi: "GANTI_KATA_SANDI_GAGAL" } })).toBe(1);
  });

  it("mengganti kata sandi; audit tidak memuat kata sandi", async () => {
    expect(await gantiKataSandiSendiri(db, id, { lama: SANDI_LAMA, baru: SANDI_BARU, ulangi: SANDI_BARU })).toEqual({ ok: true });
    const u = await db.pengguna.findUniqueOrThrow({ where: { id } });
    expect(await verifyPassword(SANDI_BARU, u.kataSandiHash)).toBe(true);
    expect(await verifyPassword(SANDI_LAMA, u.kataSandiHash)).toBe(false);
    const audit = await db.logAudit.findFirstOrThrow({ where: { penggunaId: id, aksi: "GANTI_KATA_SANDI" } });
    expect(JSON.stringify(audit)).not.toContain(SANDI_BARU);
  });
});
