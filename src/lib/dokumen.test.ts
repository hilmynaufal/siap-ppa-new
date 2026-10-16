import "dotenv/config";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { responsDokumen } from "./dokumen";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const awalan = `UjiDok${Date.now().toString(36)}`;
const PDF = Buffer.from("%PDF-1.4 fiktif");
let dir = "";
let dirLama: string | undefined;
let jenisId = "";
const laporan: string[] = [];
const dok: Record<string, string> = {};

beforeAll(async () => {
  dirLama = process.env.UPLOAD_DIR;
  dir = mkdtempSync(path.join(tmpdir(), "siap-ppa-dok-"));
  process.env.UPLOAD_DIR = dir;
  jenisId = (await db.jenisKekerasan.create({ data: { nama: `Jenis ${awalan}` } })).id;
  for (const n of ["A", "B"]) {
    const l = await db.laporan.create({
      data: { kodePendaftaran: `${awalan}-${n}`, jenisKekerasanId: jenisId, kronologi: "Kronologi fiktif.", persetujuanData: true, persetujuanPada: new Date() },
    });
    laporan.push(l.id);
  }
  mkdirSync(path.join(dir, laporan[0]));
  writeFileSync(path.join(dir, laporan[0], "akta.pdf"), PDF);
  const buat = (jalurBerkas: string) =>
    db.dokumenLaporan.create({ data: { laporanId: laporan[0], jenis: "AKTA_KELAHIRAN", namaBerkas: "akta uji.pdf", jalurBerkas, tipeMime: "application/pdf", ukuran: PDF.length } });
  dok.sah = (await buat(path.join(laporan[0], "akta.pdf"))).id;
  dok.keluar = (await buat(path.join("..", "luar.pdf"))).id;
});

afterAll(async () => {
  await db.laporan.deleteMany({ where: { id: { in: laporan } } });
  await db.jenisKekerasan.deleteMany({ where: { id: jenisId } });
  await db.$disconnect();
  process.env.UPLOAD_DIR = dirLama;
  rmSync(dir, { recursive: true, force: true });
});

describe("responsDokumen", () => {
  it("melayani berkas milik laporan dengan tipe aslinya dan tanpa cache", async () => {
    const r = await responsDokumen(db, laporan[0], dok.sah);
    expect(r.status).toBe(200);
    expect(r.headers.get("Content-Type")).toBe("application/pdf");
    expect(r.headers.get("Cache-Control")).toBe("private, no-store");
    expect(Buffer.from(await r.arrayBuffer()).equals(PDF)).toBe(true);
  });

  it("404 untuk dokumen laporan lain atau jalur yang keluar dari direktori unggahan", async () => {
    expect((await responsDokumen(db, laporan[1], dok.sah)).status).toBe(404);
    expect((await responsDokumen(db, laporan[0], dok.keluar)).status).toBe(404);
    expect((await responsDokumen(db, laporan[0], "tidak-ada")).status).toBe(404);
  });
});
