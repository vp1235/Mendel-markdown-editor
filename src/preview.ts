import MarkdownIt from "markdown-it";
import { katex as katexPlugin } from "@mdit/plugin-katex";

const md = MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(katexPlugin);

export function renderPreview(container: HTMLElement, source: string) {
  container.innerHTML = md.render(source);
}
