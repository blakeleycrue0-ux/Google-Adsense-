import "server-only";
import { Marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { slugify } from "@/lib/format";

const marked = new Marked({ gfm: true, breaks: false });

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const id = slugify(text.replace(/<[^>]+>/g, ""));
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:\/\//.test(href);
      const t = title ? ` title="${title}"` : "";
      return external
        ? `<a href="${href}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`
        : `<a href="${href}"${t}>${text}</a>`;
    },
  },
});

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2", "h3", "h4", "p", "a", "ul", "ol", "li", "strong", "em", "blockquote", "code", "pre",
    "table", "thead", "tbody", "tr", "th", "td", "hr", "br", "img", "figure", "figcaption", "del",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
    h2: ["id"],
    h3: ["id"],
    th: ["align"],
    td: ["align"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
  },
};

export function renderMarkdown(md: string) {
  return sanitizeHtml(marked.parse(md, { async: false }) as string, sanitizeOptions);
}

/** Divide el HTML en bloques que empiezan en cada `<h2>` para intercalar anuncios. */
export function renderMarkdownSections(md: string) {
  const html = renderMarkdown(md);
  const parts = html.split(/(?=<h2[\s>])/);
  const headings = [...html.matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)].map((m) => ({
    id: m[1],
    text: m[2].replace(/<[^>]+>/g, ""),
  }));
  return { parts, headings };
}

export function excerpt(md: string, length = 180) {
  const text = md
    .replace(/[#>*_`\-|]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? text.slice(0, length).replace(/\s\S*$/, "") + "…" : text;
}
