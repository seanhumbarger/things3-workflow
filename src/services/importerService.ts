/**
 * Importer Service
 *
 * Provides functions to import tasks from the Things3 SQLite database into Obsidian notes and to manage the plugin's import cache.
 *
 * Functions:
 * - runImporter(plugin):
 *   Orchestrates the import process:
 *     1. Loads plugin settings.
 *     2. Resolves the path to the Things3 SQLite database using DbPathService.
 *     3. Opens the database using SqliteProvider and sql.js WASM backend.
 *     4. Loads the plugin's import cache (to avoid duplicate imports).
 *     5. Uses Things3Service to query and filter tasks from the database.
 *     6. Writes each imported task as a note in Obsidian using NoteWriterService.
 *     7. Saves any changes to the database (if needed).
 *     8. Closes the database.
 *   Logs errors and important events to the console. Aborts import if the database cannot be opened.
 *
 * - rebuildCacheOnly(plugin):
 *   Rebuilds the Things3 Importer cache without importing or writing any notes.
 *   Queries all tasks that would be imported (using current filters), and adds their UUIDs to the cache with a placeholder file path.
 *   Useful for restoring the cache if it is lost or deleted, to prevent duplicate imports.
 *
 * Usage:
 *   import { runImporter, rebuildCacheOnly } from './importer';
 *   await runImporter(plugin);
 *   await rebuildCacheOnly(plugin);
 *
 * @module importer
 */

import { Plugin } from 'obsidian';
import { Things3WorkflowSettings } from '../settings';
import * as fs from 'fs';
import { DbPathService } from './dbPathService';
import { SqliteProvider } from '../providers/sqliteProvider';
import { Things3Service } from './things3Service';
import { NoteWriterService } from './noteWriterService';
import { CacheService } from './cacheService';

/**
 * Runs the Things3 Importer for Obsidian.
 *
 * This function orchestrates the import process:
 *   1. Loads plugin settings.
 *   2. Resolves the path to the Things3 SQLite database using DbPathService.
 *   3. Opens the database using SqliteProvider and sql.js WASM backend.
 *   4. Loads the plugin's import cache (to avoid duplicate imports).
 *   5. Uses Things3Service to query and filter tasks from the database.
 *   6. Writes each imported task as a note in Obsidian using NoteWriterService.
 *   7. Saves any changes to the database (if needed).
 *   8. Closes the database.
 *
 * @param plugin The parent Obsidian plugin instance
 *
 * Errors and important events are logged to the console. If the database cannot be opened, the import is aborted.
 */
export async function runImporter(plugin: Plugin) {

  // Obsidian plugin settings
  const settings = (plugin as any).settings as Things3WorkflowSettings;

  // Connect to Things3 database
  const dbPathHelper = new DbPathService(settings.databasePath);
  const dbPath = dbPathHelper.dbPath;
  const sqliteProvider = new SqliteProvider();
  const wasmUrl = sqliteProvider.getWasmUrl(plugin);
  const db = await sqliteProvider.openDatabase(dbPath, wasmUrl);
  if (!db) {
    console.error('[Things3 Workflow] Failed to open database.');
    return;
  }

  const pluginCache = new CacheService(plugin);
  await pluginCache.load();

  try {
    // Interact with Things3 data
    const thingsService = new Things3Service();
    const rows = thingsService.getTasks(db, settings, pluginCache);

    // Write the notes to Obsidian
    const noteWriter = new NoteWriterService();
    for (const row of rows) {
      await noteWriter.writeNote(plugin, row, settings, db, pluginCache, thingsService);
    }
    // --- Save the modified database back to disk ---
    const dbBuffer = (db as any).export() as Uint8Array;
    fs.writeFileSync(dbPath, dbBuffer);
    // console.log('[Things3 Workflow] Database changes saved to disk.');
  } finally {
    db.close();
  }
}

/**
 * Rebuilds the Things3 Importer cache without importing or writing any notes.
 *
 * This function queries all tasks that would be imported (using current filters),
 * and adds their UUIDs to the cache with a placeholder file path.
 *
 * @param plugin The parent Obsidian plugin instance
 */
export async function rebuildCacheOnly(plugin: Plugin) {
  const settings = (plugin as any).settings as Things3WorkflowSettings;
  const dbPathHelper = new DbPathService(settings.databasePath);
  const dbPath = dbPathHelper.dbPath;
  const sqliteProvider = new SqliteProvider();
  const wasmUrl = sqliteProvider.getWasmUrl(plugin);
  const db = await sqliteProvider.openDatabase(dbPath, wasmUrl);
  if (!db) {
    console.error('[Things3 Workflow] Failed to open database.');
    return;
  }
  const pluginCache = new CacheService(plugin);
  await pluginCache.load();
  try {
    const thingsService = new Things3Service();
    const rows = thingsService.getTasks(db, settings, pluginCache);
    for (const row of rows) {
      pluginCache.add(row.uuid, {
        importedAt: new Date().toISOString(),
        filePath: '' // No file path since we are not importing
      });
    }
    await pluginCache.save();
    console.log('[Things3 Workflow] Cache rebuilt with', rows.length, 'tasks.');
  } finally {
    db.close();
  }
}
