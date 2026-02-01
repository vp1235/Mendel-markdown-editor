import { createEditor, setEditorContent } from "./editor";
import { renderPreview } from "./preview";
import { initSplitPane } from "./split-pane";
import { TabManager, Tab } from "./tabs";
import { openFileDialog, saveToFile, saveFileAsDialog, readFile, updateTitle } from "./fileops";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

// DOM elements
const tabBarEl = document.getElementById("tab-bar")!;
const app = document.getElementById("app")!;
const editorPane = document.getElementById("editor-pane")!;
const divider = document.getElementById("divider")!;
const previewPane = document.getElementById("preview-pane")!;

// Default welcome content for new untitled tabs
const defaultContent = `# Welcome to Markdown Editor

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

const editor = createEditor(
  editorPane,
  (doc) => {
    renderPreview(previewPane, doc);
    tabs.updateContent(doc);
    tabs.markDirty(true);
  },
  [
    { key: "Mod-o", run: () => { handleOpen(); return true; } },
    { key: "Mod-s", run: () => { handleSave(); return true; } },
    { key: "Mod-Shift-s", run: () => { handleSaveAs(); return true; } },
    { key: "Mod-w", run: () => { tabs.closeTab(tabs.getActive().id); return true; } },
    { key: "Mod-t", run: () => { openNewTab(); return true; } },
  ]
);

// --- Tab manager setup ---
const tabs = new TabManager(tabBarEl, {
  onSwitch: (newTab: Tab, _oldTab: Tab | null) => {
    // Load the new tab's content into the editor and preview
    setEditorContent(editor, newTab.content);
    renderPreview(previewPane, newTab.content);
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
    renderPreview(previewPane, content);
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
