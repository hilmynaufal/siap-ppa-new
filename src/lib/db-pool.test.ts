import { describe, expect, it } from "vitest";
import { POOL_MAX_BAWAAN, konfigurasiPool } from "./db-pool";

describe("konfigurasiPool", () => {
  it("memakai batas bawaan kecil dan menutup koneksi menganggur", () => {
    expect(konfigurasiPool({})).toEqual({ max: POOL_MAX_BAWAAN, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 });
    expect(POOL_MAX_BAWAAN).toBeLessThan(10);
  });

  it("DB_POOL_MAX dapat diatur; nilai tidak wajar diabaikan", () => {
    expect(konfigurasiPool({ DB_POOL_MAX: "3" }).max).toBe(3);
    for (const salah of ["0", "-1", "abc", "2.5", "999"]) expect(konfigurasiPool({ DB_POOL_MAX: salah }).max, salah).toBe(POOL_MAX_BAWAAN);
  });
});
