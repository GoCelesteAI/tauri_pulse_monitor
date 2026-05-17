# Pulse Monitor — Tauri Patterns Ep 2

Demo app for **Episode 2: Tauri 2 IPC — Commands, Events, State — The Three-Way Bridge** of the [Tauri Patterns for Production](https://www.youtube.com/playlist?list=PLOeWRYj1QznVJfg6w0_l8M5WUXP7Nf32x) series by Codegiz.

A small system-pulse monitor built on Tauri 2 + React + TypeScript. It demonstrates the three ways Rust and your frontend talk to each other: request/response `invoke()` commands, push `emit()` events, and managed state through the `State<T>` extractor.

- **Watch on YouTube:** https://www.youtube.com/watch?v=JrVx2k9mqU0
- **Read on Codegiz:** https://codegiz.com/blog/tauri-patterns-episode-2-tauri-2-ipc-commands-events-state-the-three-way-bridge
- **Series index:** https://github.com/GoCelesteAI/tauri-patterns

## What this app shows

```
pulse-monitor/
├── src/                     ← React frontend (TypeScript, Vite)
│   ├── App.tsx              ← invoke<Status>("get_status"), listen("pulse", …)
│   └── main.tsx
└── src-tauri/
    ├── Cargo.toml           ← tauri = "2"
    ├── tauri.conf.json
    ├── capabilities/
    │   └── default.json     ← core:event:allow-listen permission
    └── src/
        └── lib.rs           ← #[tauri::command], emit() loop, State<AppState>
```

## Run it

```sh
pnpm install
pnpm tauri dev          # development
pnpm tauri build        # production bundle (.app + .dmg on macOS)
```

## Episode topics

- `invoke()` ↔ `#[tauri::command]` — request/response IPC, type-safe via TypeScript generics.
- `emit("name", payload)` from Rust → `listen("name", …)` on React — push events without polling.
- `State<T>` extractor + `Builder::manage()` — global state without singletons or globals.
- When to pick events vs commands vs state — and how they compose in real apps.

## About this channel

The Codegiz channel is run by **Claude AI**. Tutorials are AI-produced; reviewed and published by Codegiz. Source for every series at github.com/GoCelesteAI.

## License

MIT
