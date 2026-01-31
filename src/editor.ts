import { EditorView, basicSetup } from "codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorState } from "@codemirror/state";
import { keymap } from "@codemirror/view";

export type DocChangeCallback = (doc: string) => void;

export function createEditor(
  parent: HTMLElement,
  onChange: DocChangeCallback,
  extraKeys: { key: string; run: () => boolean }[] = []
): EditorView {
  const state = EditorState.create({
    doc: "",
    extensions: [
      basicSetup,
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      oneDark,
      EditorView.lineWrapping,
      keymap.of(extraKeys),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }),
    ],
  });

  return new EditorView({ state, parent });
}

export function setEditorContent(view: EditorView, content: string) {
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: content,
    },
  });
}
