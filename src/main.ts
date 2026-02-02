import { createEditor, setEditorContent } from "./editor";
import { renderPreview } from "./preview";
import { initSplitPane } from "./split-pane";
import { TabManager, Tab } from "./tabs";
import { openFileDialog, saveToFile, saveFileAsDialog, readFile, updateTitle } from "./fileops";
import { exportTxt, exportHtml, exportPdf, exportPng, exportJpg, exportDocx, exportRtf, deriveExportTitle } from "./export";
import { createImagePasteExtension, createImageDropExtension } from "./image-handler";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";

// DOM elements
const tabBarEl = document.getElementById("tab-bar")!;
const app = document.getElementById("app")!;
const editorPane = document.getElementById("editor-pane")!;
const divider = document.getElementById("divider")!;
const previewPane = document.getElementById("preview-pane")!;

// Default welcome content for new untitled tabs
const defaultContent = `# Welcome to Mendel

A minimal editor with **live preview** and LaTeX math support.

## Math Examples

Inline math: $E = mc^2$

Block math:

$$
\\int_0^\\infty e^{-x} \\, dx = 1
$$

$$
\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}
$$

## Features

- **Live preview** as you type
- **KaTeX** math rendering
- **Syntax highlighting** for code blocks
- **File operations** (Open, Save, Save As)
- **Draggable** split pane

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

> Start editing to see the preview update in real time.
`;

// --- Editor setup ---
function getEditorContent(): string {
  return editor.state.doc.toString();
}

function getActiveFilePath(): string | null {
  try { return tabs.getActive().filePath; } catch { return null; }
}

function getBasePath(): string | null {
  const fp = getActiveFilePath();
  if (!fp) return null;
  return fp.substring(0, fp.lastIndexOf("/"));
}

const editor = createEditor(
  editorPane,
  (doc) => {
    renderPreview(previewPane, doc, getBasePath());
    tabs.updateContent(doc);
    tabs.markDirty(true);
  },
  [
    { key: "Mod-o", run: () => { handleOpen(); return true; } },
    { key: "Mod-s", run: () => { handleSave(); return true; } },
    { key: "Mod-Shift-s", run: () => { handleSaveAs(); return true; } },
    { key: "Mod-w", run: () => { tabs.closeTab(tabs.getActive().id); return true; } },
    { key: "Mod-t", run: () => { openNewTab(); return true; } },
  ],
  [
    createImagePasteExtension(getActiveFilePath),
    createImageDropExtension(getActiveFilePath),
  ]
);

// --- Tab manager setup ---
const tabs = new TabManager(tabBarEl, {
  onSwitch: (newTab: Tab, _oldTab: Tab | null) => {
    // Load the new tab's content into the editor and preview
    setEditorContent(editor, newTab.content);
    const base = newTab.filePath ? newTab.filePath.substring(0, newTab.filePath.lastIndexOf("/")) : null;
    renderPreview(previewPane, newTab.content, base);
    updateTitle(newTab.filePath);
  },
  onAllClosed: () => {
    // If all tabs are closed, create a fresh untitled tab
    openNewTab();
  },
});

// --- Helper functions ---
function openNewTab(filePath: string | null = null, content: string = defaultContent) {
  // If file is already open in a tab, switch to it
  if (filePath) {
    const existing = tabs.findByPath(filePath);
    if (existing) {
      tabs.switchTo(existing.id);
      return;
    }
  }
  tabs.createTab(filePath, content);
}

async function handleOpen() {
  const result = await openFileDialog();
  if (result) {
    openNewTab(result.path, result.content);
  }
}

async function handleSave() {
  const active = tabs.getActive();
  const content = getEditorContent();
  if (active.filePath) {
    await saveToFile(content, active.filePath);
    tabs.markDirty(false);
  } else {
    await handleSaveAs();
  }
}

async function handleSaveAs() {
  const content = getEditorContent();
  const result = await saveFileAsDialog(content);
  if (result) {
    tabs.markSaved(result.path);
    updateTitle(result.path);
  }
}

async function openFilePath(path: string) {
  const existing = tabs.findByPath(path);
  if (existing) {
    tabs.switchTo(existing.id);
    // Reload content in case file changed on disk
    const content = await readFile(path);
    setEditorContent(editor, content);
    tabs.updateContent(content);
    tabs.markDirty(false);
    const base = path.substring(0, path.lastIndexOf("/"));
    renderPreview(previewPane, content, base);
  } else {
    const content = await readFile(path);
    tabs.createTab(path, content);
  }
}

// --- Create initial untitled tab ---
// (The createTab call triggers onSwitch which loads the content into the editor)
tabs.createTab(null, defaultContent);

// --- Split pane ---
initSplitPane(app, divider);

// --- Menu events from Rust ---
const appWindow = getCurrentWindow();
appWindow.listen("menu-open", () => handleOpen());
appWindow.listen("menu-save", () => handleSave());
appWindow.listen("menu-save-as", () => handleSaveAs());

// --- Export menu events ---
appWindow.listen("menu-export-pdf", () => { const t = deriveExportTitle(getEditorContent()); exportPdf(previewPane, t); });
appWindow.listen("menu-export-html", () => { const t = deriveExportTitle(getEditorContent()); exportHtml(previewPane, t); });
appWindow.listen("menu-export-docx", () => { const t = deriveExportTitle(getEditorContent()); exportDocx(previewPane.innerHTML, t); });
appWindow.listen("menu-export-rtf", () => { const t = deriveExportTitle(getEditorContent()); exportRtf(previewPane.innerHTML, t); });
appWindow.listen("menu-export-png", () => { const t = deriveExportTitle(getEditorContent()); exportPng(previewPane, t); });
appWindow.listen("menu-export-jpg", () => { const t = deriveExportTitle(getEditorContent()); exportJpg(previewPane, t); });
appWindow.listen("menu-export-txt", () => { const md = getEditorContent(); exportTxt(md, deriveExportTitle(md)); });

// --- Insert Image menu event ---
appWindow.listen("menu-insert-image", async () => {
  const selected = await open({
    multiple: false,
    filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"] }],
  });
  if (!selected) return;
  const srcPath = selected as string;
  const activeFile = getActiveFilePath();
  if (!activeFile) {
    alert("Please save the file first before inserting images.");
    return;
  }
  // Copy the image file directly via Rust: read as base64 then write to assets
  const dir = activeFile.substring(0, activeFile.lastIndexOf("/"));
  const assetsDir = `${dir}/assets`;
  await invoke("ensure_directory", { path: assetsDir });
  const ext = srcPath.split(".").pop() || "png";
  const filename = `image-${Date.now()}.${ext}`;
  const destPath = `${assetsDir}/${filename}`;
  // Use a Rust command to copy the file
  await invoke("copy_file", { src: srcPath, dest: destPath });
  const pos = editor.state.selection.main.head;
  editor.dispatch({ changes: { from: pos, insert: `![](./assets/${filename})` } });
});

// --- macOS file association (double-click in Finder) ---
invoke("take_opened_file").then((path: unknown) => {
  if (path) {
    openFilePath(path as string);
  }
});

// --- Files opened while app is already running ---
appWindow.listen("open-file", async (event) => {
  await openFilePath(event.payload as string);
});

// --- Poll for files opened via CLI hook ---
setInterval(async () => {
  const path: string | null = await invoke("check_pending_open");
  if (path) {
    await openFilePath(path);
  }
}, 2000);
