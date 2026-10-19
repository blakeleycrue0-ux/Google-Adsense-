import { describe, expect, it } from "vitest";
import { parseOpenverse, parsePexels } from "@/lib/images/providers";

// Respuestas reducidas con la forma documentada de cada API (no son resultados reales).
describe("análisis de respuestas de proveedores", () => {
  it("Openverse: descarta licencias no comerciales", () => {
    const list = parseOpenverse({
      results: [
        { id: "a", title: "Laptop", url: "https://x/a.jpg", license: "by", license_version: "2.0", foreign_landing_url: "https://flickr/a", width: 2000, height: 1300 },
        { id: "b", title: "Laptop NC", url: "https://x/b.jpg", license: "by-nc", foreign_landing_url: "https://flickr/b" },
      ],
    });
    expect(list[0].usable).toBe(true);
    expect(list[1].usable).toBe(false);
    expect(list[1].blockedReason).toMatch(/comercial/);
  });

  it("Pexels: licencia y autoría", () => {
    const [p] = parsePexels({
      photos: [{ id: 1, width: 4000, height: 2600, url: "https://www.pexels.com/photo/1", photographer: "Leo", photographer_url: "https://p/leo", alt: "USB-C cable", src: { original: "o", large2x: "l2", large: "l", medium: "m" } }],
    });
    expect(p.license).toBe("pexels");
  });
});
