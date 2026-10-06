import { describe, expect, it } from "vitest";
import { berandaUntuk, putuskanAkses } from "./akses";
import { hashPassword, verifyPassword } from "./password";
import { readSecret, signSession, verifySession } from "./session";

const SECRET = "x".repeat(40);

describe("password", () => {
  it("memverifikasi kata sandi yang benar dan menolak yang salah", async () => {
    const hash = await hashPassword("rahasia-uji");
    expect(await verifyPassword("rahasia-uji", hash)).toBe(true);
    expect(await verifyPassword("salah", hash)).toBe(false);
  });
  it("menolak format hash yang tidak dikenal", async () => {
    expect(await verifyPassword("apa", "bukan-hash")).toBe(false);
  });
});

describe("sesi", () => {
  it("menandatangani dan memverifikasi", async () => {
    const token = await signSession({ userId: "u1", peran: "ADMIN" }, SECRET);
    expect(await verifySession(token, SECRET)).toEqual({ userId: "u1", peran: "ADMIN" });
  });
  it("menolak token dengan kunci lain, rusak, atau kosong", async () => {
    const token = await signSession({ userId: "u1", peran: "ADMIN" }, SECRET);
    expect(await verifySession(token, "y".repeat(40))).toBeNull();
    expect(await verifySession(token + "x", SECRET)).toBeNull();
    expect(await verifySession(undefined, SECRET)).toBeNull();
  });
  it("mewajibkan SESSION_SECRET minimal 32 karakter", () => {
    expect(() => readSecret({})).toThrow();
    expect(() => readSecret({ SESSION_SECRET: "pendek" })).toThrow();
    expect(readSecret({ SESSION_SECRET: SECRET })).toBe(SECRET);
  });
});

describe("hak akses per peran", () => {
  it("halaman publik (Pelapor, masuk) terbuka tanpa sesi", () => {
    expect(putuskanAkses("/", null)).toEqual({ aksi: "izinkan" });
    expect(putuskanAkses("/masuk", null)).toEqual({ aksi: "izinkan" });
  });
  it("area terlindungi mengarahkan yang belum masuk ke /masuk", () => {
    expect(putuskanAkses("/admin", null)).toEqual({ aksi: "ke-masuk" });
    expect(putuskanAkses("/pendamping/jadwal", null)).toEqual({ aksi: "ke-masuk" });
  });
  it("Admin hanya ke /admin, Pendamping hanya ke /pendamping", () => {
    expect(putuskanAkses("/admin/laporan", "ADMIN")).toEqual({ aksi: "izinkan" });
    expect(putuskanAkses("/pendamping", "ADMIN")).toEqual({ aksi: "ke-beranda", peran: "ADMIN" });
    expect(putuskanAkses("/pendamping/sesi", "PENDAMPING")).toEqual({ aksi: "izinkan" });
    expect(putuskanAkses("/admin", "PENDAMPING")).toEqual({ aksi: "ke-beranda", peran: "PENDAMPING" });
  });
  it("awalan mirip tidak ikut terlindungi secara keliru", () => {
    expect(putuskanAkses("/administrasi", null)).toEqual({ aksi: "izinkan" });
  });
  it("beranda per peran", () => {
    expect(berandaUntuk("ADMIN")).toBe("/admin");
    expect(berandaUntuk("PENDAMPING")).toBe("/pendamping");
  });
});
