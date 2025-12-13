---
sidebar_position: 7
---

# Development

## Contributing
- Fork the repo and submit pull requests.
- Follow the code style and add tests for new features.
- Document all public methods and keep methods small and testable.

## Code Structure
- `src/` — Main plugin code
  - `main.ts` — Plugin entry point
  - `pluginMeta.ts` — Centralized plugin metadata
  - `settings.ts` — Plugin settings interface and defaults
  - `settingsTab.ts` — Settings UI
  - `providers/` — Database provider (e.g., `sqliteProvider.ts`)
  - `services/` — Import, cache, note writing, and Things3 query logic
    - `cacheService.ts` — Persistent cache for imported tasks
    - `dbPathService.ts` — Database path resolution and validation
    - `importerService.ts` — Import orchestration and cache rebuild
    - `noteWriterService.ts` — Note creation and file handling
    - `things3Service.ts` — Query/filter Things3 tasks and checklist items
- `docs-site/` — Documentation site (Docusaurus)

## Building & Testing
- `make build` — Build the plugin and copy files to your test vault
- `make lint` — Check code style
- `make lint-fix` — Auto-fix lint errors
- `make test` — Run tests (Jest)
- `make docs` — Build and view documentation for deployment

## Version Management
- The plugin version is managed in `manifest.json` (authoritative for Obsidian) and `package.json` (for npm/dev tooling).
- `versions.json` maps plugin versions to minimum supported Obsidian app versions.
- The documentation version in `docs-site/docs/_index.md` is updated automatically.
- Use `make bump-version` or `npm version <newversion>` to update all version references. This will prompt for a new version, update all relevant files, and keep your documentation in sync.

## License
MIT License. See [LICENSE](license.md).

---

> **Note:** Development and testing was performed using Node.js version 20.19.6. For best results, use this version or later (unless otherwise specified).
