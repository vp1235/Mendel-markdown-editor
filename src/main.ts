import { createEditor, setEditorContent } from "./editor";
import { renderPreview } from "./preview";
import { initSplitPane } from "./split-pane";
import { openFile, saveFile, saveFileAs, loadFile } from "./fileops";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

const app = document.getElementById("app")!;
const editorPane = document.getElementById("editor-pane")!;
const divider = document.getElementById("divider")!;
const previewPane = document.getElementById("preview-pane")!;

// Default content
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

function getEditorContent(): string {
  return editor.state.doc.toString();
}

const editor = createEditor(
  editorPane,
  (doc) => renderPreview(previewPane, doc),
  [
    {
      key: "Mod-o",
      run: () => {
        handleOpen();
        return true;
      },
    },
    {
      key: "Mod-s",
      run: () => {
        saveFile(getEditorContent());
        return true;
      },
    },
    {
      key: "Mod-Shift-s",
      run: () => {
        saveFileAs(getEditorContent());
        return true;
      },
    },
  ]
);

// Set initial content
setEditorContent(editor, defaultContent);
renderPreview(previewPane, defaultContent);

// Split pane
initSplitPane(app, divider);

// Listen for menu events from Rust
async function handleOpen() {
  const content = await openFile();
  if (content !== null) {
    setEditorContent(editor, content);
    renderPreview(previewPane, content);
  }
}

const appWindow = getCurrentWindow();
appWindow.listen("menu-open", () => handleOpen());
appWindow.listen("menu-save", () => saveFile(getEditorContent()));
appWindow.listen("menu-save-as", () => saveFileAs(getEditorContent()));

// Poll for files opened via CLI hook
setInterval(async () => {
  const path: string | null = await invoke("check_pending_open");
  if (path) {
    const content = await loadFile(path);
    setEditorContent(editor, content);
    renderPreview(previewPane, content);
  }
}, 2000);
