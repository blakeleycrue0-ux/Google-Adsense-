import { describe, expect, it } from "vitest";
import { parseCommons, parseOpenverse, parsePexels, parseUnsplash } from "@/lib/images/providers";

// Respuestas reducidas con la forma documentada de cada API (no son resultados reales).
describe("análisis de respuestas de proveedores", () => {
  it("Wikimedia Commons: licencia, autor y página de origen", () => {
    const [c] = parseCommons({
      query: {
        pages: {
          "1": {
            pageid: 123,
            title: "File:Example phone.jpg",
            imageinfo: [
              {
                url: "https://upload.wikimedia.org/x.jpg",
                thumburl: "https://upload.wikimedia.org/thumb/x.jpg",
                width: 3000,
                height: 2000,
                mime: "image/jpeg",
                descriptionurl: "https://commons.wikimedia.org/wiki/File:Example_phone.jpg",
                extmetadata: { LicenseShortName: { value: "CC BY-SA 4.0" }, Artist: { value: '<a href="x">Jane Doe</a>' } },
              },
            ],
          },
          "2": { pageid: 9, title: "File:Diagram.svg", imageinfo: [{ url: "u", width: 1, height: 1, mime: "image/svg+xml", descriptionurl: "d" }] },
        },
      },
    });
    expect(c.license).toBe("cc-by-sa");
    expect(c.author).toBe("Jane Doe");
    expect(c.usable).toBe(true);
    expect(c.title).toBe("Example phone");
  });

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

  it("Pexels y Unsplash: atribución y enlace obligatorio", () => {
    const [p] = parsePexels({
      photos: [{ id: 1, width: 4000, height: 2600, url: "https://www.pexels.com/photo/1", photographer: "Leo", photographer_url: "https://p/leo", alt: "USB-C cable", src: { original: "o", large2x: "l2", large: "l", medium: "m" } }],
    });
    expect(p.license).toBe("pexels");
    const [u] = parseUnsplash({
      results: [{ id: "z", width: 5000, height: 3300, alt_description: "phone", urls: { raw: "https://images.unsplash.com/r", small: "s", regular: "g" }, links: { html: "https://unsplash.com/photos/z", download_location: "https://api.unsplash.com/photos/z/download" }, user: { name: "Mia", links: { html: "https://unsplash.com/@mia" } } }],
    });
    expect(u.hotlink).toBe(true);
    expect(u.trackUrl).toContain("/download");
    expect(u.sourceUrl).toContain("utm_source=voltio");
  });
});
