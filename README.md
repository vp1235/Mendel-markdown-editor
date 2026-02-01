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

Mendel can auto-preview markdown files every time Claude Code writes or edits a `.md` file.

1. Create a hook script (e.g. `~/.claude-hooks/markdown-preview.sh`):

```bash
#!/bin/bash
INPUT=$(cat)
FP=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[[ "$FP" == *.md ]] && echo "$FP" > /tmp/.markdowneditor-open && open -a "Markdown Editor"
exit 0
```

2. Make it executable: `chmod +x ~/.claude-hooks/markdown-preview.sh`

3. Add a PostToolUse hook to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude-hooks/markdown-preview.sh"
          }
        ]
      }
    ]
  }
}
```

The app polls for the signal file and automatically loads the updated markdown with live preview.

## License

Copyright (c) 2025-2026 Victor Keegan de la Peña. All rights reserved. See [LICENSE](LICENSE).
