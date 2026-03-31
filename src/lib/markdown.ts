import { Marked } from "marked";
import hljs from "highlight.js";

const marked = new Marked({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
      const highlighted = hljs.highlight(text, { language }).value;
      return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
    },
  },
});

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
