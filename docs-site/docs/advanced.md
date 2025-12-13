---
sidebar_position: 5
---

# Advanced

## CacheService
- Tracks imported tasks to prevent duplicates.
- Stored as a JSON file (`imported.json`) in the plugin folder.
- If a note is deleted from the cache but not from the vault, the next import will overwrite the file.
- Use the command palette to clear or rebuild the cache as needed.
- The cache is stored in `$vault/.obsidian/plugins/things3-workflow/imported.json` and can be manually edited if necessary.
- Use the "Rebuild Things3 Workflow Cache (without importing)" command to repopulate the cache if it is lost or deleted, without creating or modifying any notes.

## Custom Note Headers & Tags
- Change section headers in settings for Note, Details, and Checklist.
- Add custom tags to every imported note (deduplicated with existing tags).
- Optionally add project and area as tags.
