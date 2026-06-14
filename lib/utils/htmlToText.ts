/** Convert Tiptap HTML to plain text with bullet/number list prefixes. Safe to import server-side. */
export function htmlToPlainText(html: string): string {
  if (!html) return "";
  let olCounter = 0;
  let inOl = false;
  return html
    .replace(/<ol[^>]*>/gi, () => { inOl = true; olCounter = 0; return ""; })
    .replace(/<\/ol>/gi, () => { inOl = false; return ""; })
    .replace(/<ul[^>]*>/gi, () => { inOl = false; return ""; })
    .replace(/<\/ul>/gi, "")
    .replace(/<li[^>]*>/gi, () => inOl ? `${++olCounter}. ` : "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/?(h[1-6]|p)[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
