import { Plugin } from 'obsidian';

/**
 * CacheService
 *
 * Manages a persistent cache of imported Things3 tasks for an Obsidian plugin.
 *
 * The cache is stored as a JSON file in the plugin's data folder and tracks which tasks have been imported,
 * along with metadata such as import time and file path. This prevents duplicate imports and allows
 * for cache clearing, inspection, and rebuilding. The cache is keyed by Things3 UUID.
 *
 * Features:
 * - Persistent JSON cache file (default: 'imported.json') in the plugin's data folder.
 * - Tracks imported tasks with import time and file path.
 * - Prevents duplicate imports by checking UUIDs.
 * - Supports clearing, rebuilding, and inspecting the cache.
 * - All methods are asynchronous for compatibility with Obsidian's vault adapter.
 *
 * Usage:
 *   const cache = new CacheService(plugin);
 *   await cache.load();
 *   cache.add(uuid, { importedAt, filePath });
 *   await cache.save();
 *
 * Methods:
 *   - load(): Load the cache from disk (initializes to empty if missing or invalid).
 *   - save(): Save the cache to disk.
 *   - has(uuid): Check if a task UUID is in the cache.
 *   - add(uuid, entry): Add or update a cache entry.
 *   - getAll(): Get a shallow copy of the entire cache.
 *   - clear(): Clear the cache and save.
 *
 * @class CacheService
 */
export interface PluginCacheEntry {
  /** ISO string of when the task was imported */
  importedAt: string;
  /** Path to the file created for this task */
  filePath: string;
}

export class CacheService {
  /** In-memory cache of imported tasks, keyed by Things3 UUID */
  private cache: Record<string, PluginCacheEntry> = {};
  /** Path to the JSON cache file in the plugin's data folder */
  private filePath: string;
  /** Reference to the parent Obsidian plugin */
  private plugin: Plugin;

  /**
   * Create a new CacheService instance.
   * @param plugin - The parent Obsidian plugin instance
   * @param fileName - Optional cache file name (default: 'imported.json')
   */
  constructor(plugin: Plugin, fileName = 'imported.json') {
    this.plugin = plugin;
    const pluginId = plugin.manifest.id;
    this.filePath = `${plugin.app.vault.configDir}/plugins/${pluginId}/${fileName}`;
  }

  /**
   * Load the cache from disk. If the file does not exist or is invalid, starts with an empty cache.
   */
  async load(): Promise<void> {
    try {
      const exists = await this.plugin.app.vault.adapter.exists(this.filePath);
      if (exists) {
        const data = await this.plugin.app.vault.adapter.read(this.filePath);
        this.cache = JSON.parse(data);
      } else {
        this.cache = {};
      }
    } catch (_) {
      this.cache = {};
    }
  }

  /**
   * Save the current cache to disk.
   */
  async save(): Promise<void> {
    await this.plugin.app.vault.adapter.write(this.filePath, JSON.stringify(this.cache, null, 2));
  }

  /**
   * Check if a given Things3 UUID is present in the cache.
   * @param uuid - The Things3 task UUID
   * @returns true if the UUID is cached, false otherwise
   */
  has(uuid: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.cache, uuid);
  }

  /**
   * Add or update a cache entry for a Things3 UUID.
   * @param uuid - The Things3 task UUID
   * @param entry - The cache entry to store
   */
  add(uuid: string, entry: PluginCacheEntry): void {
    this.cache[uuid] = entry;
  }

  /**
   * Get a shallow copy of the entire cache object.
   * @returns A copy of the cache (keyed by UUID)
   */
  getAll(): Record<string, PluginCacheEntry> {
    return { ...this.cache };
  }

  /**
   * Clear the cache and save the empty state to disk.
   */
  async clear(): Promise<void> {
    this.cache = {};
    await this.save();
  }
}
