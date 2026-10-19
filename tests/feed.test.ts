import { describe, expect, it } from "vitest";
import { parseFeed } from "@/lib/ingest";

describe("imagen declarada en el feed", () => {
  it("lee media:content con crédito", () => {
    const xml = `<?xml version="1.0"?><rss xmlns:media="http://search.yahoo.com/mrss/"><channel><item>
      <title>Nuevo chip</title><link>https://ejemplo.com/a</link><description>Texto</description>
      <media:content url="https://ejemplo.com/img.jpg" medium="image"><media:credit>Foto: Prensa</media:credit></media:content>
    </item></channel></rss>`;
    const [it0] = parseFeed(xml);
    expect(it0.image?.url).toBe("https://ejemplo.com/img.jpg");
    expect(it0.image?.credit).toBe("Foto: Prensa");
  });
  it("lee enclosure de tipo imagen", () => {
    const xml = `<rss><channel><item><title>T</title><link>https://e.com/b</link><enclosure url="https://e.com/b.png" type="image/png" length="1"/></item></channel></rss>`;
    expect(parseFeed(xml)[0].image?.url).toBe("https://e.com/b.png");
  });
});
