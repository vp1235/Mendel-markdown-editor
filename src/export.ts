import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { toPng, toJpeg } from "html-to-image";

/** Extract a filename-safe title from the first H1 heading in markdown, or fall back to "Untitled". */
export function deriveExportTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (!match) return "Untitled";
  return match[1].replace(/[<>:"/\\|?*]/g, "").trim() || "Untitled";
}

/** Print-friendly CSS overrides targeting #preview-pane to replace dark theme with light. */
const PRINT_CSS = `
  #preview-pane { background: #ffffff !important; color: #333333 !important; }
  #preview-pane h1, #preview-pane h2, #preview-pane h3,
  #preview-pane h4, #preview-pane h5, #preview-pane h6 { color: #1a1a1a !important; }
  #preview-pane h1, #preview-pane h2 { border-bottom-color: #cccccc !important; }
  #preview-pane code { background: #f5f5f5 !important; color: #333333 !important; }
  #preview-pane pre { background: #f5f5f5 !important; color: #333333 !important; }
  #preview-pane pre code { background: none !important; }
  #preview-pane blockquote { border-left-color: #cccccc !important; color: #666666 !important; }
  #preview-pane a { color: #0066cc !important; }
  #preview-pane th, #preview-pane td { border-color: #cccccc !important; }
  #preview-pane th { background: #f0f0f0 !important; color: #1a1a1a !important; }
  #preview-pane hr { border-top-color: #cccccc !important; }
`;

/** Inject print-friendly styles into a document (used by html2canvas onclone and for image export). */
function injectPrintStyles(doc: Document): void {
  const style = doc.createElement("style");
  style.id = "mendel-print-override";
  style.textContent = PRINT_CSS;
  doc.head.appendChild(style);
}

/** Temporarily apply print styles to the live document; returns a cleanup function. */
function applyPrintStyles(): () => void {
  injectPrintStyles(document);
  return () => {
    const el = document.getElementById("mendel-print-override");
    if (el) el.remove();
  };
}

async function saveBinary(base64: string, defaultName: string, filterName: string, ext: string): Promise<void> {
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: filterName, extensions: [ext] }],
  });
  if (!path) return;
  await invoke("write_binary_file", { path, base64Data: base64 });
}

export async function exportTxt(markdown: string, title: string): Promise<void> {
  const path = await save({
    defaultPath: `${title}.txt`,
    filters: [{ name: "Text", extensions: ["txt"] }],
  });
  if (!path) return;
  await invoke("write_file_contents", { path, contents: markdown });
}

export async function exportHtml(previewEl: HTMLElement, title: string): Promise<void> {
  const path = await save({
    defaultPath: `${title}.html`,
    filters: [{ name: "HTML", extensions: ["html"] }],
  });
  if (!path) return;

  // Collect KaTeX styles (needed for math rendering)
  const styles: string[] = [];
  for (const sheet of document.styleSheets) {
    try {
      const rules = Array.from(sheet.cssRules).map((r) => r.cssText).join("\n");
      styles.push(rules);
    } catch {
      // cross-origin stylesheet -- skip
    }
  }

  // Light-theme overrides for exported HTML
  const printOverrides = `
    body { background: #ffffff; color: #333333; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; }
    .preview-content { max-width: 800px; margin: 0 auto; padding: 24px 32px; }
    .preview-content h1, .preview-content h2, .preview-content h3,
    .preview-content h4, .preview-content h5, .preview-content h6 { color: #1a1a1a; }
    .preview-content h1, .preview-content h2 { border-bottom-color: #cccccc; }
    .preview-content code { background: #f5f5f5; color: #333333; }
    .preview-content pre { background: #f5f5f5; color: #333333; }
    .preview-content pre code { background: none; }
    .preview-content blockquote { border-left-color: #cccccc; color: #666666; }
    .preview-content a { color: #0066cc; }
    .preview-content th, .preview-content td { border-color: #cccccc; }
    .preview-content th { background: #f0f0f0; color: #1a1a1a; }
    .preview-content hr { border-top-color: #cccccc; }
  `;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>${styles.join("\n")}\n${printOverrides}</style>
</head>
<body>
<div class="preview-content">${previewEl.innerHTML}</div>
</body>
</html>`;

  await invoke("write_file_contents", { path, contents: html });
}

export async function exportPdf(previewEl: HTMLElement, title: string): Promise<void> {
  const outPath = await save({
    defaultPath: `${title}.pdf`,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (!outPath) return;

  // Collect all stylesheets (KaTeX, preview, etc.)
  const styles: string[] = [];
  for (const sheet of document.styleSheets) {
    try {
      const rules = Array.from(sheet.cssRules).map((r) => r.cssText).join("\n");
      styles.push(rules);
    } catch {
      // cross-origin stylesheet -- skip
    }
  }

  const printOverrides = `
    @page { size: A4; margin: 20mm; }
    body { background: #ffffff; color: #333333; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; }
    .preview-content { padding: 0; line-height: 1.6; }
    .preview-content h1, .preview-content h2, .preview-content h3,
    .preview-content h4, .preview-content h5, .preview-content h6 { color: #1a1a1a; }
    .preview-content h1, .preview-content h2 { border-bottom-color: #cccccc; }
    .preview-content h2, .preview-content h3 { page-break-after: avoid; }
    .preview-content code { background: #f5f5f5; color: #333333; }
    .preview-content pre { background: #f5f5f5; color: #333333; page-break-inside: avoid; }
    .preview-content pre code { background: none; }
    .preview-content blockquote { border-left-color: #cccccc; color: #666666; }
    .preview-content a { color: #0066cc; }
    .preview-content table { page-break-inside: avoid; }
    .preview-content th, .preview-content td { border-color: #cccccc; }
    .preview-content th { background: #f0f0f0; color: #1a1a1a; }
    .preview-content hr { border-top-color: #cccccc; }
  `;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${styles.join("\n")}\n${printOverrides}</style>
</head>
<body>
<div class="preview-content">${previewEl.innerHTML}</div>
</body>
</html>`;

  const tmpPath = "/tmp/mendel-export-pdf.html";
  await invoke("write_file_contents", { path: tmpPath, contents: html });
  await invoke("html_to_pdf", { htmlPath: tmpPath, outputPath: outPath });
}

export async function exportPng(previewEl: HTMLElement, title: string): Promise<void> {
  const removePrintStyles = applyPrintStyles();
  try {
    const dataUrl = await toPng(previewEl, { backgroundColor: "#ffffff" });
    const base64 = dataUrl.split(",")[1];
    await saveBinary(base64, `${title}.png`, "PNG Image", "png");
  } finally {
    removePrintStyles();
  }
}

export async function exportJpg(previewEl: HTMLElement, title: string): Promise<void> {
  const removePrintStyles = applyPrintStyles();
  try {
    const dataUrl = await toJpeg(previewEl, { backgroundColor: "#ffffff", quality: 0.95 });
    const base64 = dataUrl.split(",")[1];
    await saveBinary(base64, `${title}.jpg`, "JPEG Image", "jpg");
  } finally {
    removePrintStyles();
  }
}

export async function exportDocx(previewHtml: string, title: string): Promise<void> {
  const outPath = await save({
    defaultPath: `${title}.docx`,
    filters: [{ name: "Word Document", extensions: ["docx"] }],
  });
  if (!outPath) return;

  const tmpPath = "/tmp/mendel-export-tmp.html";
  const wrappedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${previewHtml}</body></html>`;
  await invoke("write_file_contents", { path: tmpPath, contents: wrappedHtml });
  await invoke("convert_with_textutil", { htmlPath: tmpPath, outputPath: outPath, format: "docx" });
}

export async function exportRtf(previewHtml: string, title: string): Promise<void> {
  const outPath = await save({
    defaultPath: `${title}.rtf`,
    filters: [{ name: "Rich Text", extensions: ["rtf"] }],
  });
  if (!outPath) return;

  const tmpPath = "/tmp/mendel-export-tmp.html";
  const wrappedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${previewHtml}</body></html>`;
  await invoke("write_file_contents", { path: tmpPath, contents: wrappedHtml });
  await invoke("convert_with_textutil", { htmlPath: tmpPath, outputPath: outPath, format: "rtf" });
}
