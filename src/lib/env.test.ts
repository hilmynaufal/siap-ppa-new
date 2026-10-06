import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("menerima DATABASE_URL yang terisi", () => {
    expect(parseEnv({ DATABASE_URL: "postgresql://x" }).DATABASE_URL).toBe("postgresql://x");
  });
  it("menolak DATABASE_URL kosong", () => {
    expect(() => parseEnv({})).toThrow();
  });
});
