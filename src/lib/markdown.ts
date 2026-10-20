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
