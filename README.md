# Sniff
Sniff is a terminal file navigator built with OpenTUI.

It supports:
- fast keyboard navigation
- multi-selection
- tabs
- favorites
- command mode (`.`)
- inline popup notifications
- copy/paste and image conversion commands

## Requirements
- Node.js 18+ (recommended: latest LTS)
- Bun (project is configured to run via Bun)

## Installation
```bash
bun install
```

## Run
From this project directory:
```bash
bun .
```

## Core Navigation
| Key | Action |
| --- | --- |
| `j` | Move selection down |
| `k` | Move selection up |
| `Shift+j` | Extend multi-selection downward |
| `Shift+k` | Extend multi-selection upward |
| `Enter` | Enter selected directory |
| `Backspace` | Go to parent directory |
| `Tab` | Switch focus between sidebar and file list |
| `q` | Quit |

## File Actions
| Key | Action |
| --- | --- |
| `e` | Open selected item in configured editor |
| `r` | Rename selected item |
| `n` | Create new file |
| `delete` / `d` | Delete selected item(s) |
| `c` | Copy selected item(s) to internal clipboard |
| `v` | Paste clipboard into current directory |

Notes:
- `c`/`v` support files and directories.
- Name conflicts on paste are resolved with suffixes like `-copy`, `-copy2`, etc.

## Search and Prompt Input
| Key | Action |
| --- | --- |
| `/` | Open search input for current directory |
| `Escape` | Close input bar |

## Tabs
| Key | Action |
| --- | --- |
| `t` | Create new tab |
| `x` | Close current tab |
| `]` | Next tab |
| `[` | Previous tab |

## Favorites
When focused in file list:
| Key | Action |
| --- | --- |
| `f` | Add current directory to favorites |

When focused in favorites sidebar:
| Key | Action |
| --- | --- |
| `f` | Rename selected favorite |
| `delete` | Remove selected favorite |
| `Shift+j` | Move favorite down |
| `Shift+k` | Move favorite up |
| `Enter` | Open favorite directory |

Favorites are stored in:
- `~/sniffconfig.json`

## Command Mode
Press `.` to open command input.

Available commands:
- `.prompt <message>`: show a popup message
- `.reload`: reload current directory listing
- `.convert <format>`: convert selected image file(s) to another format
- `.exit`: quit sniff

`convert` currently supports:
- `webp`
- `png`
- `jpg` / `jpeg`

Examples:
```txt
.prompt hello
.reload
.convert webp
.convert jpg
.exit
```

## Last Visited Directory
Sniff writes the current directory to:
- `~/.sniff-last-dir`

This is useful for shell wrappers that `cd` after sniff exits.

Example `zsh`/`bash` function:
```sh
e() {
  bun "$HOME/projects/private/tui/sniff" "$@"
  local d
  d="$(cat "$HOME/.sniff-last-dir" 2>/dev/null)"
  [ -n "$d" ] && [ -d "$d" ] && cd "$d"
}
```

## Editor Configuration
The editor command is defined in:
- `src/settings.ts`

Current default:
- `code`

## Notes
- Popup notifications appear in the bottom-right and auto-dismiss.
- Multi-selection range is based on current cursor + offset (`Shift+j`/`Shift+k`).
