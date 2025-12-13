---
sidebar_position: 4
---

# Usage

## Importing Tasks
- Open the command palette (Cmd/Ctrl + P)
- Search for "Import from Things3"
- The plugin will import tasks based on your filters and settings

## Example Imported Note
```markdown
---
t3_uuid: TyJKLH8b3MgqXhtApSmP5E
t3_link: things:///show?id=TyJKLH8b3MgqXhtApSmP5E
t3_created_date: 2025-12-12
t3_start_date: 2025-12-10
t3_end_date: 2025-12-13
t3_deadline: 2025-12-15
t3_status: open
tags: ['#imported', '#project', '#area', '#custom']
---

# Note
Task title here

# Details
Task notes/body here

# Checklist
- [ ] Subtask 1
- [x] Subtask 2
```

## Command Palette Commands
- **Import from Things3**: Import tasks, projects, and areas from Things 3 into Obsidian notes.
- **Clear Things3 Workflow Cache**: Clears the import cache (`imported.json`).
- **Rebuild Things3 Workflow Cache (without importing)**: Scans the Things 3 database and repopulates the cache with all importable tasks, but does NOT create or modify any notes in your vault. Use this if your cache file is lost or deleted to prevent duplicate imports.

## Overwriting Notes
If a note is deleted from the cache but not from the vault, the plugin will overwrite it on the next import to ensure consistency.

## Troubleshooting
If you see errors or missing notes, check your database path and filters. For more help, see [Troubleshooting](troubleshooting.md).
