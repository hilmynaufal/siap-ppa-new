import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { imporKontak, periksaImporKontak, TEMPLAT_CSV, uraiCsv } from "./impor-kontak";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const awalan = `UjiImpor${Math.random().toString(36).slice(2, 7)}`;
let adminId = "";

beforeAll(async () => {
  adminId = (await db.pengguna.create({ data: { nama: "Penguji Impor", email: `${awalan.toLowerCase()}@contoh.test`, kataSandiHash: "x", peran: "ADMIN" } })).id;
});
afterAll(async () => {
  await db.kontakDarurat.deleteMany({ where: { instansi: { startsWith: awalan } } });
  await db.pengguna.deleteMany({ where: { id: adminId } });
  await db.$disconnect();
});

const csv = (...baris: string[]) => ["instansi;telepon;alamat;kecamatan", ...baris].join("\r\n");

describe("uraiCsv", () => {
  it("mendeteksi titik koma atau koma, kutip, kutip ganda, dan baris di dalam kutip", () => {
    expect(uraiCsv("a;b\r\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
    expect(uraiCsv("a,b\n1,2\n")).toEqual([["a", "b"], ["1", "2"]]);
    expect(uraiCsv('a;b\n"x;y";"say ""hi"""\n')).toEqual([["a", "b"], ["x;y", 'say "hi"']]);
    expect(uraiCsv('a;b\n"baris\nkedua";z')).toEqual([["a", "b"], ["baris\nkedua", "z"]]);
    expect(uraiCsv("﻿a;b\n\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("templat dapat diurai", () => {
    expect(uraiCsv(TEMPLAT_CSV)[0]).toEqual(["instansi", "telepon", "alamat", "kecamatan"]);
  });
});

describe("impor kontak darurat", () => {
  it("memeriksa berkas tanpa menulis; semua baris valid atau tidak sama sekali", async () => {
    const teks = csv(`${awalan} A;(022) 5800 0001;Jl. Fiktif 1;Soreang`, `${awalan} B;0812 3456 7890;Jl. Fiktif 2;`);
    const p = await periksaImporKontak(db, teks);
    expect(p).toMatchObject({ ok: true, galat: [], dilewati: [] });
    expect(p.valid.map((v) => [v.instansi, v.kecamatan])).toEqual([[`${awalan} A`, "Soreang"], [`${awalan} B`, null]]);
    expect(await db.kontakDarurat.count({ where: { instansi: { startsWith: awalan } } })).toBe(0);

    const buruk = csv(`${awalan} C;(022) 5800 0003;Jl. Fiktif 3;Soreang`, `${awalan} D;abc;Jl. Fiktif 4;Soreang`, `${awalan} E;(022) 5800 0005;Jl. Fiktif 5;Kecamatan Antah`);
    const hasil = await imporKontak(db, buruk, adminId);
    expect(hasil.ok).toBe(false);
    expect(hasil.pratinjau.galat.map((g) => g.baris)).toEqual([3, 4]);
    expect(await db.kontakDarurat.count({ where: { instansi: { startsWith: awalan } } })).toBe(0);
  });

  it("mengimpor, mencatat pembuat, dan melewati baris yang sudah ada atau kembar", async () => {
    const teks = csv(`${awalan} A;(022) 5800 0001;Jl. Fiktif 1;soreang`, `${awalan} B;0812 3456 7890;Jl. Fiktif 2;`, `${awalan} B;0812 3456 7890;Jl. Fiktif 2;`);
    const h = await imporKontak(db, teks, adminId);
    expect(h).toMatchObject({ ok: true, ditambah: 2, dilewati: 1 });
    const baris = await db.kontakDarurat.findMany({ where: { instansi: { startsWith: awalan } }, include: { kecamatan: true } });
    expect(baris).toHaveLength(2);
    expect(baris.every((b) => b.dibuatOlehId === adminId && b.aktif)).toBe(true);
    expect(baris.find((b) => b.instansi.endsWith("A"))?.kecamatan?.nama).toBe("Soreang");
    expect(await imporKontak(db, teks, adminId)).toMatchObject({ ok: true, ditambah: 0, dilewati: 3 });
  });

  it("menolak berkas tanpa kolom wajib atau kosong", async () => {
    expect(await periksaImporKontak(db, "")).toMatchObject({ ok: false, pesan: "Berkas kosong." });
    expect(await periksaImporKontak(db, "nama;hp\nx;y")).toMatchObject({ ok: false, pesan: expect.stringContaining("Kolom tidak ditemukan") });
    expect(await periksaImporKontak(db, "instansi;telepon;alamat;kecamatan")).toMatchObject({ ok: false, pesan: expect.stringContaining("tidak berisi data") });
  });
});
