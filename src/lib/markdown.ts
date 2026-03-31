import { Marked } from "marked";
import hljs from "highlight.js";

const CALLOUT_TYPES: Record<string, { className: string; icon: string; label: string }> = {
  "⚠️": { className: "callout-warning", icon: "⚠️", label: "주의" },
  "💡": { className: "callout-tip", icon: "💡", label: "팁" },
  "✅": { className: "callout-success", icon: "✅", label: "완료" },
  "ℹ️": { className: "callout-info", icon: "ℹ️", label: "정보" },
};

const marked = new Marked({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
      const highlighted = hljs.highlight(text, { language }).value;
      return `<div class="code-block-wrapper"><pre><code class="hljs language-${language}">${highlighted}</code></pre><button class="copy-code-btn" data-code="${escapeAttr(text)}" title="복사">📋</button></div>`;
    },

    blockquote({ tokens }: { tokens: any[] }) {
      const inner = this.parser!.parse(tokens);
      const textContent = inner.replace(/<[^>]+>/g, "").trim();

      for (const [emoji, config] of Object.entries(CALLOUT_TYPES)) {
        if (textContent.startsWith(emoji)) {
          const content = inner
            .replace(new RegExp(`^<p>${escapeRegex(emoji)}\\s*`), "<p>")
            .replace(/^<p>\s*<\/p>/, "");
          return `<div class="callout ${config.className}"><div class="callout-icon">${config.icon}</div><div class="callout-content">${content}</div></div>`;
        }
      }

      return `<blockquote>${inner}</blockquote>`;
    },

    table({ header, rows }: { header: any[]; rows: any[][] }) {
      const headerCells = header
        .map((cell: any) => `<th>${this.parser!.parseInline(cell.tokens)}</th>`)
        .join("");
      const bodyRows = rows
        .map((row: any[]) => {
          const cells = row
            .map((cell: any) => `<td>${this.parser!.parseInline(cell.tokens)}</td>`)
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");
      return `<div class="table-wrapper"><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
    },

    listitem({ tokens, task, checked }: { tokens: any[]; task: boolean; checked: boolean }) {
      const text = this.parser!.parse(tokens, !!this.parser);
      if (task) {
        const icon = checked
          ? '<span class="task-check checked">✓</span>'
          : '<span class="task-check unchecked"></span>';
        return `<li class="task-item ${checked ? "task-done" : "task-pending"}">${icon}${text}</li>`;
      }
      return `<li>${text}</li>`;
    },

    hr() {
      return '<hr class="styled-hr" />';
    },

    heading({ tokens, depth }: { tokens: any[]; depth: number }) {
      const text = this.parser!.parseInline(tokens);
      const slug = slugify(text);
      return `<h${depth} id="${slug}">${text}</h${depth}>`;
    },

    image({ href, title, text }: { href: string; title: string | null; text: string }) {
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
      const caption = text ? `<figcaption>${text}</figcaption>` : "";
      return `<figure class="image-figure"><img src="${href}" alt="${escapeAttr(text)}"${titleAttr} loading="lazy" />${caption}</figure>`;
    },
  },
});

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "");
}

export interface TocItem {
  depth: number;
  text: string;
  slug: string;
}

export function extractToc(md: string): TocItem[] {
  const items: TocItem[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(md)) !== null) {
    const text = match[2].replace(/[*_`\[\]()]/g, "").trim();
    items.push({
      depth: match[1].length,
      text,
      slug: slugify(text),
    });
  }
  return items;
}

export function renderMarkdown(md: string): string {
  return marked.parse(md) as string;
}

export function excerpt(md: string, maxLength = 150): string {
  const text = md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*_\`\[\]()>~-]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}
