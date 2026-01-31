# Mendel Markdown Editor

A lightweight (~12 MB) markdown editor built with Tauri v2. Supports live preview, KaTeX math rendering, and syntax-highlighted code blocks. Works as a standalone desktop app or as a Claude Code companion that auto-previews `.md` files as they are written.

<!-- ![Screenshot](screenshot.png) -->

## Standalone Usage

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri CLI](https://tauri.app/start/): `cargo install tauri-cli`

### Build from Source

```bash
git clone https://github.com/vp1235/Mendel-markdown-editor.git
cd Mendel-markdown-editor
npm install
cargo tauri build
```

The compiled app will be in `src-tauri/target/release/bundle/`.

### Development

```bash
npm install
cargo tauri dev
```

## Claude Code Integration

Mendel can auto-preview markdown files every time Claude Code writes or edits a `.md` file. Add a PostToolUse hook to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "/Users/YOU/Code/markdowneditor/preview-hook.sh \"$FILEPATH\""
      }
    ]
  }
}
```

Replace `/Users/YOU/` with your home directory. The hook script opens (or refreshes) Mendel with the file that was just modified.

## License

Copyright (c) 2025-2026 Victor Keegan de la Peña. All rights reserved. See [LICENSE](LICENSE).
