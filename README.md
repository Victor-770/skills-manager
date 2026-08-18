# skills-manage

`skills-manage` is a Tauri desktop app for managing AI coding agent skills across multiple platforms from one place.

[中文文档](README_CN.md)

> **Attribution & Origin**
>
> This project is based on the open-source project [iamzhihuix/skills-manage](https://github.com/iamzhihuix/skills-manage).

> **Disclaimer**
>
> `skills-manage` is an independent desktop application for managing local skill directories and importing public skill metadata. It is not affiliated with, endorsed by, or sponsored by Anthropic, OpenAI, GitHub, MiniMax, or any other supported platform, publisher, or trademark owner.

## Overview

`skills-manage` follows the [Agent Skills](https://github.com/anthropics/agent-skills) open pattern and uses `~/.agents/skills/` as the canonical central directory. Skills can then be installed to individual platforms through symlinks, so one source of truth can drive multiple AI coding tools.

## Extended Features in this Fork

This version introduces powerful project-level skill management and batch workflow capabilities:

- **Project-to-Project Skills Copy (跨项目技能复制)**: Easily replicate platform skills from one project directory to another target project, with visual diff preview and conflict handling (skip / overwrite).
- **Permanent Project Skill Deletion (项目技能永久删除)**: Delete discovered project skills directly from disk (Shift+Delete mode) with safety confirmation prompts.
- **Direct Collection Management for Project Skills (项目技能直接加入技能集)**: Add discovered project skills directly into skill collections without forcibly copying or polluting the central library (`~/.agents/skills/`).
- **Batch Selection & Multi-Collection Adding (批量选择与批量加入技能集)**: Multi-select discovered project skills and batch-add them to one or multiple skill collections at once, with instant collection creation support.

## Key Highlights

- **Central & Platform Management**: Central skill library plus per-platform install and uninstall flows.
- **Claude Code Integration**: Surface native skills and read-only marketplace plugin skills in one platform view.
- **Full Skill Detail Viewer**: Markdown preview, raw source view, and AI explanation generation.
- **Skill Collections**: Organize skills into collections and batch-install them to platforms or project folders.
- **Project Discovery (Discover Scan)**: Scan project-level skill libraries across local directories, including Obsidian vaults (`.skills/`, `.agents/skills/`, `.claude/skills/`).
- **Marketplace & GitHub Import**: Browse community skills and import directly from GitHub repositories.
- **Fast Search**: Optimized for large skill libraries with deferred queries, lazy indexing, and virtualization.
- **Modern UI**: Bilingual interface (English / Chinese), Catppuccin themes, accent color customization, and responsive navigation.

## Screenshots

### Central skills and platform installs

![Central skills library view](images/01.png)

### Review installed skills on a specific platform

![Platform skill view](images/06.png)

### Discover local project skill libraries

![Discover project skill libraries](images/03.png)

### Browse marketplace publishers and skills

![Marketplace view](images/04.png)

### Import skills from a GitHub repository

![GitHub repository import wizard](images/02.png)

### Organize reusable collections

![Skill collections view](images/05.png)

## Download

- Original upstream repository: <https://github.com/iamzhihuix/skills-manage>

## Supported Platforms

| Category | Platform | Skills Directory |
|----------|----------|-----------------|
| Coding | Claude Code | `~/.claude/skills/` |
| Coding | Codex CLI | `~/.agents/skills/` |
| Coding | Cursor | `~/.cursor/skills/` |
| Coding | Gemini CLI | `~/.gemini/skills/` |
| Coding | Trae | `~/.trae/skills/` |
| Coding | Factory Droid | `~/.factory/skills/` |
| Coding | Junie | `~/.junie/skills/` |
| Coding | Qwen | `~/.qwen/skills/` |
| Coding | Trae CN | `~/.trae-cn/skills/` |
| Coding | Windsurf | `~/.windsurf/skills/` |
| Coding | Qoder | `~/.qoder/skills/` |
| Coding | Augment | `~/.augment/skills/` |
| Coding | OpenCode | `~/.opencode/skills/` |
| Coding | KiloCode | `~/.kilocode/skills/` |
| Coding | OB1 | `~/.ob1/skills/` |
| Coding | Amp | `~/.amp/skills/` |
| Coding | Kiro | `~/.kiro/skills/` |
| Coding | CodeBuddy | `~/.codebuddy/skills/` |
| Coding | Hermes | `~/.hermes/skills/` |
| Coding | Copilot | `~/.copilot/skills/` |
| Coding | Aider | `~/.aider/skills/` |
| Lobster | OpenClaw (开爪) | `~/.openclaw/skills/` |
| Lobster | QClaw (千爪) | `~/.qclaw/skills/` |
| Lobster | EasyClaw (简爪) | `~/.easyclaw/skills/` |
| Lobster | EasyClaw V2 | `~/.easyclaw-20260322-01/skills/` |
| Lobster | AutoClaw | `~/.openclaw-autoclaw/skills/` |
| Lobster | WorkBuddy (打工搭子) | `~/.workbuddy/skills-marketplace/skills/` |
| Central | Central Skills | `~/.agents/skills/` |

> Note: Claude Code also surfaces marketplace plugin directories under `~/.claude/plugins/marketplaces/*` as read-only rows in the Claude view. Those entries are display-only and are not managed like native skills in `~/.claude/skills/`.

Custom platforms can be added through Settings.

## Privacy & Security

- **Local-first storage** — metadata, collections, scan results, settings, and cached AI explanations stay in `~/.skillsmanage/db.sqlite` or the local skill directories you manage.
- **No telemetry** — the app does not include analytics, crash reporting, or usage tracking.
- **Network access is feature-driven** — outbound requests only happen when you explicitly use marketplace sync/download, GitHub import, or AI explanation generation.
- **Credentials are stored locally** — GitHub PAT and AI API keys are kept in the local SQLite settings table and are not encrypted at rest by the app.
- Never post real secrets in issues, pull requests, screenshots, or logs.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop framework | Tauri v2 |
| Frontend | React 19, TypeScript, Tailwind CSS 4 |
| UI components | shadcn/ui, Lucide icons |
| State management | Zustand |
| Markdown | react-markdown |
| i18n | react-i18next, i18next-browser-languagedetector |
| Theming | Catppuccin 4-flavor palette |
| Backend | Rust (serde, sqlx, chrono, uuid) |
| Database | SQLite via sqlx (WAL mode) |
| Routing | react-router-dom v7 |

## Development & Build

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/)
- [Rust toolchain](https://rustup.rs/) (stable)
- Tauri v2 system dependencies: <https://v2.tauri.app/start/prerequisites/>

### Install Dependencies

```bash
pnpm install
```

### Run in Development

```bash
pnpm tauri dev
```

The Vite dev server runs on port `24200`.

### Build Distribution Package

```bash
pnpm tauri build
```

Generated installer packages will be located in `src-tauri/target/release/bundle/`.

### Validation

```bash
pnpm test
pnpm typecheck
pnpm lint
cd src-tauri && cargo test
cd src-tauri && cargo clippy -- -D warnings
```

## Project Structure

```text
skills-manage/
├── src/                        # React frontend
│   ├── components/             # UI components
│   ├── i18n/                   # Locale files and i18n setup
│   ├── lib/                    # Frontend helpers
│   ├── pages/                  # Route views
│   ├── stores/                 # Zustand stores
│   ├── test/                   # Vitest + RTL tests
│   └── types/                  # Shared TypeScript types
├── src-tauri/                  # Rust backend
│   └── src/
│       ├── commands/           # Tauri IPC handlers
│       ├── db.rs               # SQLite schema, migrations, queries
│       ├── lib.rs              # Tauri app setup
│       └── main.rs             # Desktop entry point
├── public/                     # Static assets
├── CHANGELOG.md                # English changelog
├── CHANGELOG.zh.md             # Chinese changelog
└── release-notes/              # GitHub release notes
```

## Database

The SQLite database lives at `~/.skillsmanage/db.sqlite` and is initialized automatically on first launch.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE).
