/**
 * Things3WorkflowPlugin
 *
 * Obsidian plugin to import tasks from the Things3 SQLite database into Obsidian notes.
 *
 * Features:
 * - Imports tasks from Things3, with support for filtering by tags, projects, and areas.
 * - Customizes note creation, including section headers, custom tags, and project/area as tags.
 * - Imports checklist items and task body/notes if present.
 * - Adds date metadata (created, start, deadline, status) and a link back to the original Things3 task in the note frontmatter.
 * - Tracks imported tasks using a local cache file (imported.json) to prevent duplicates.
 * - Overwrites existing notes if the cache is missing an entry but the file exists.
 * - Provides commands to clear or rebuild the import cache from the command palette.
 * - Settings UI for all configuration, including custom tags, note headers, and destination folder.
 *
 * Usage:
 * - Use the command palette to import tasks, clear the cache, or rebuild the cache without importing.
 * - Configure plugin settings in the options pane, including filters, note headers, and custom tags.
 *
 * @class Things3WorkflowPlugin
 * @extends Plugin
 */
import { Plugin } from 'obsidian';
import { runImporter } from './services/importerService';
import { Things3WorkflowSettings } from './settings';
import { Things3WorkflowSettingTab } from './settingsTab';
import { CacheService } from './services/cacheService';

export default class Things3WorkflowPlugin extends Plugin {
  /**
   * Plugin settings loaded from disk and used throughout the plugin.
   */
  settings!: Things3WorkflowSettings;

  /**
   * Called by Obsidian when the plugin is loaded.
   * Loads settings, registers the settings tab, and adds commands.
   */
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new Things3WorkflowSettingTab(this.app, this));
    this.addCommand({
      id: 'run-things-importer',
      name: 'Import from Things',
      callback: () => {
        console.log('[Things3 Workflow] Command palette invoked');
        runImporter(this);
      },
    });
    this.addCommand({
      id: 'clear-things-importer-cache',
      name: 'Clear Things3 Workflow Cache',
      callback: async () => {
        const cache = new CacheService(this);
        await cache.load();
        await cache.clear();
        // @ts-ignore
        this.app?.notifications?.show('Things3 Workflow cache cleared!') || new (window as any).Notice('Things3 Workflow cache cleared!');
      },
    });
    this.addCommand({
      id: 'rebuild-things-importer-cache',
      name: 'Rebuild Things3 Workflow Cache (without importing)',
      callback: async () => {
        const { rebuildCacheOnly } = await import('./services/importerService');
        await rebuildCacheOnly(this);
        // @ts-ignore
        this.app?.notifications?.show('Things3 Workflow cache rebuilt!') || new (window as any).Notice('Things3 Workflow cache rebuilt!');
      },
    });
    // Optionally, schedule background import every 30 minutes
    // TODO: Need to consider this a bit further before allowing it.  I've noticed that settings don't seem to persist properly between reloads, which could lead to confusion.
    // setInterval(() => {
    //   console.log('[Things3 Workflow] Scheduled import triggered');
    //   runImporter(this);
    // }, 30 * 60 * 1000);
  }

  /**
   * Loads plugin settings from disk.
   * Populates this.settings with the loaded values.
   */
  async loadSettings() {
    this.settings = Object.assign({}, await this.loadData());
    if (!this.settings.destinationFolder) {
      this.settings.destinationFolder = 'things3';
    }
    console.log('[Things3 Workflow] Settings loaded:', this.settings);
  }

  /**
   * Saves plugin settings to disk.
   */
  async saveSettings() {
    await this.saveData(this.settings);
    console.log('[Things3 Workflow] Settings saved');
  }
}
