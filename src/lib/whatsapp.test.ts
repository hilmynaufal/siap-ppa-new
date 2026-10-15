import { afterEach, describe, expect, it, vi } from "vitest";
import { nomorPonsel, tautanWaDarurat, tautanWhatsapp } from "./whatsapp";

describe("tautanWhatsapp", () => {
  it("mengubah nomor lokal 08xx ke format internasional", () => {
    expect(tautanWhatsapp("0812-3456-7890")).toBe("https://wa.me/6281234567890");
  });
  it("menerima nomor yang sudah berawalan +62", () => {
    expect(tautanWhatsapp("+62 812 3456 7890")).toBe("https://wa.me/6281234567890");
  });
  it("menyandikan pesan pembuka", () => {
    expect(tautanWhatsapp("081234567890", "Halo, tolong")).toBe("https://wa.me/6281234567890?text=Halo%2C%20tolong");
  });
  it("mengembalikan null untuk nomor kosong atau tidak wajar", () => {
    expect(tautanWhatsapp(undefined)).toBeNull();
    expect(tautanWhatsapp("")).toBeNull();
    expect(tautanWhatsapp("12345")).toBeNull();
  });
});

describe("nomorPonsel", () => {
  it("menerima nomor ponsel 08xx dan +628xx", () => {
    expect(nomorPonsel("0812 3456 7890")).toBe(true);
    expect(nomorPonsel("+62 831-0000-0000")).toBe(true);
  });
  it("menolak telepon kantor dan nomor kosong", () => {
    expect(nomorPonsel("(022) 5890 0000")).toBe(false);
    expect(nomorPonsel(null)).toBe(false);
  });
});

describe("tautanWaDarurat", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });
  it("mendahulukan WA_DARURAT", () => {
    vi.stubEnv("WA_DARURAT", "081200000001");
    expect(tautanWaDarurat("081200000002")).toMatch(/^https:\/\/wa\.me\/6281200000001\?text=/);
  });
  it("memakai nomor kontak aktif bila WA_DARURAT kosong dan nomornya ponsel", () => {
    vi.stubEnv("WA_DARURAT", "");
    expect(tautanWaDarurat("081200000002")).toMatch(/^https:\/\/wa\.me\/6281200000002\?text=/);
  });
  it("mengembalikan null bila kontak aktif telepon kantor", () => {
    vi.stubEnv("WA_DARURAT", "");
    expect(tautanWaDarurat("(022) 5890 0000")).toBeNull();
  });
});
