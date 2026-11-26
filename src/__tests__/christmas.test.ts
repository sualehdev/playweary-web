import { describe, expect, it } from "vitest";
import { isXmasActive } from "@/christmas/config";

describe("isXmasActive", () => {
  it("is on before the end date", () => expect(isXmasActive(new Date("2026-12-10T12:00:00"), undefined)).toBe(true));
  it("ends on the end date", () => expect(isXmasActive(new Date("2026-12-27T00:00:00"), undefined)).toBe(false));
  it("is off when the flag says off", () => expect(isXmasActive(new Date("2026-12-10T12:00:00"), "off")).toBe(false));
});
