import { invoke } from "@tauri-apps/api/core";
import { EditorView } from "codemirror";

export async function handleImageInsert(
  view: EditorView,
  file: File,
  currentFilePath: string | null
): Promise<void> {
  if (!currentFilePath) {
    alert("Please save the file first before inserting images.");
    return;
  }

  const dir = currentFilePath.substring(0, currentFilePath.lastIndexOf("/"));
  const assetsDir = `${dir}/assets`;
  await invoke("ensure_directory", { path: assetsDir });

  const ext = file.name.split(".").pop() || "png";
  const filename = `image-${Date.now()}.${ext}`;
  const fullPath = `${assetsDir}/${filename}`;

  const buf = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  await invoke("write_binary_file", { path: fullPath, base64Data: base64 });

  const pos = view.state.selection.main.head;
  const insert = `![](./assets/${filename})`;
  view.dispatch({ changes: { from: pos, insert } });
}

export function createImagePasteExtension(getFilePath: () => string | null) {
  return EditorView.domEventHandlers({
    paste(event: ClipboardEvent, view: EditorView) {
      const items = event.clipboardData?.items;
      if (!items) return false;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) handleImageInsert(view, file, getFilePath());
          return true;
        }
      }
      return false;
    },
  });
}

export function createImageDropExtension(getFilePath: () => string | null) {
  return EditorView.domEventHandlers({
    drop(event: DragEvent, view: EditorView) {
      const files = event.dataTransfer?.files;
      if (!files) return false;
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          event.preventDefault();
          handleImageInsert(view, file, getFilePath());
          return true;
        }
      }
      return false;
    },
  });
}
