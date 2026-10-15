import { describe, expect, it } from "vitest";
import { tautanWhatsapp } from "./whatsapp";

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
