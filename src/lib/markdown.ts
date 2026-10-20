import "server-only";
import { Marked } from "marked";
import sanitizeHtml from "sanitize-html";

const marked = new Marked({ gfm: true, breaks: false });

marked.use({
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const t = title ? ` title="${title}"` : "";
      return /^https?:\/\//.test(href)
        ? `<a href="${href}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`
        : `<a href="${href}"${t}>${text}</a>`;
    },
  },
});

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ["h2", "h3", "p", "a", "ul", "ol", "li", "strong", "em", "blockquote", "hr", "br", "table", "thead", "tbody", "tr", "th", "td"],
  allowedAttributes: { a: ["href", "title", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
};

export function renderMarkdown(md: string) {
  return sanitizeHtml(marked.parse(md, { async: false }) as string, sanitizeOptions);
}

/**
 * Divide el HTML en dos mitades por un párrafo intermedio para intercalar un
 * anuncio dentro de la noticia (solo si es lo bastante larga).
 */
export function splitForAd(html: string): [string, string] {
  const blocks = html.split(/(?<=<\/p>)/);
  if (blocks.length < 5) return [html, ""];
  const mid = Math.floor(blocks.length / 2);
  return [blocks.slice(0, mid).join(""), blocks.slice(mid).join("")];
}
