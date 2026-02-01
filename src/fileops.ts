import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open, save } from "@tauri-apps/plugin-dialog";

export function updateTitle(path: string | null) {
  const name = path ? path.split(/[\\/]/).pop() || path : "Untitled";
  getCurrentWindow().setTitle(`${name} - Mendel`);
}

export async function openFileDialog(): Promise<{ path: string; content: string } | null> {
  const selected = await open({
    multiple: false,
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
  });
  if (!selected) return null;

  const path = selected as string;
  const content: string = await invoke("read_file_contents", { path });
  return { path, content };
}

export async function saveToFile(content: string, filePath: string): Promise<void> {
  await invoke("write_file_contents", { path: filePath, contents: content });
}

export async function saveFileAsDialog(content: string): Promise<{ path: string } | null> {
  const selected = await save({
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
  });
  if (!selected) return null;

  const path = selected as string;
  await invoke("write_file_contents", { path, contents: content });
  return { path };
}

export async function readFile(path: string): Promise<string> {
  return invoke("read_file_contents", { path });
}
