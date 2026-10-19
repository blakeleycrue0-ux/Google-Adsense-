import { describe, expect, it } from "vitest";
import { attributionText, isUsable, licenseFromText } from "@/lib/images/licenses";

describe("licencias", () => {
  it.each([
    ["CC BY-SA 4.0", "cc-by-sa"],
    ["CC BY 2.0", "cc-by"],
    ["by-sa", "cc-by-sa"],
    ["CC0", "cc0"],
    ["Public domain", "pdm"],
    ["pdm", "pdm"],
    ["CC BY-NC 2.0", "cc-by-nc"],
    ["by-nc-sa", "cc-by-nc-sa"],
    ["CC BY-ND 4.0", "cc-by-nd"],
    ["Copyrighted free use? no", "unknown"],
    ["", "unknown"],
  ])("%s → %s", (raw, code) => {
    expect(licenseFromText(raw).code).toBe(code);
  });

  it("solo admite licencias con uso comercial y modificación", () => {
    expect(isUsable("cc-by-sa")).toBe(true);
    expect(isUsable("cc0")).toBe(true);
    expect(isUsable("cc-by-nc")).toBe(false);
    expect(isUsable("cc-by-nd")).toBe(false);
    expect(isUsable("unknown")).toBe(false);
  });

  it("genera la atribución con autor, procedencia y licencia", () => {
    expect(attributionText({ author: "Ana", licenseName: "CC BY-SA 4.0", provider: "openverse", license: "cc-by-sa" })).toBe(
      "Foto: Ana · vía Openverse · CC BY-SA 4.0",
    );
  });
});
