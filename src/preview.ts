import MarkdownIt from "markdown-it";
import { katex as katexPlugin } from "@mdit/plugin-katex";
import { convertFileSrc } from "@tauri-apps/api/core";

const md = MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(katexPlugin);

export function renderPreview(container: HTMLElement, source: string, basePath: string | null = null) {
  container.innerHTML = md.render(source);

  if (basePath) {
    const images = container.querySelectorAll("img");
    for (const img of images) {
      const src = img.getAttribute("src");
      if (!src) continue;
      // Skip URLs and data URIs
      if (/^(https?:\/\/|data:|asset:\/\/)/.test(src)) continue;
      // Resolve absolute or relative path
      const absolute = src.startsWith("/") ? src : `${basePath}/${src}`;
      img.src = convertFileSrc(absolute);
    }
  }
}
