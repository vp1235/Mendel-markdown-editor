import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open, save } from "@tauri-apps/plugin-dialog";

let currentFilePath: string | null = null;

function filenameFromPath(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

function updateTitle(path: string | null) {
  const title = path ? `${filenameFromPath(path)} - Markdown Editor` : "Markdown Editor";
  getCurrentWindow().setTitle(title);
}

export async function openFile(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
  });
  if (!selected) return null;

  const path = selected as string;
  const contents: string = await invoke("read_file_contents", { path });
  currentFilePath = path;
  updateTitle(path);
  return contents;
}

export async function saveFile(content: string): Promise<boolean> {
  if (!currentFilePath) {
    return saveFileAs(content);
  }
  await invoke("write_file_contents", { path: currentFilePath, contents: content });
  return true;
}

export async function saveFileAs(content: string): Promise<boolean> {
  const selected = await save({
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
  });
  if (!selected) return false;

  const path = selected as string;
  await invoke("write_file_contents", { path, contents: content });
  currentFilePath = path;
  updateTitle(path);
  return true;
}

export async function loadFile(path: string): Promise<string> {
  const contents: string = await invoke("read_file_contents", { path });
  currentFilePath = path;
  updateTitle(path);
  return contents;
}

export function getCurrentPath(): string | null {
  return currentFilePath;
}
