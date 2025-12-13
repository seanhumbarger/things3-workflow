---
sidebar_position: 3
---

# Configuration

All configuration is managed via the plugin's settings tab in Obsidian. Each option is described below.

## Database Path
Set the path to your Things 3 SQLite database. On macOS, this is usually auto-detected. You can override it if needed.

## Filters

By default, all tasks are imported. You can set filters to limit which tasks are imported:

- **Tags**: Comma-separated list to filter imported tasks by tag.
- **Projects**: Filter by project name(s).
- **Areas**: Filter by area name(s).

## Import Options
- **Custom Tags**: Add custom tags to imported notes (deduplicated).
- **Include Project/Area as Tags**: Optionally add project and area as tags.
- **Custom Note Headers**: Change section headers (default: Note, Detail, Checklist).
- **Destination Folder**: Choose where imported notes are saved in your vault.  Default is the `$vault/things3`.

See [Usage](usage.md) for more details.
