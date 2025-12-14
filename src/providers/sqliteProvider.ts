import * as fs from 'fs';
import initSqlJs, { Database } from 'sql.js';
import { Plugin, normalizePath } from 'obsidian';

/**
 * SqliteProvider
 *
 * Utility class for opening and managing SQLite databases using sql.js in an Obsidian plugin context.
 *
 * Features:
 * - Opens a Things3 SQLite database file using the sql.js WASM backend (WebAssembly).
 * - Resolves the correct WASM file URL for the plugin, ensuring compatibility in Obsidian's environment.
 * - Throws clear errors on failure to open the database or load WASM.
 *
 * WebAssembly (WASM) is a binary instruction format that allows running high-performance code (like SQLite) in JavaScript environments. sql.js uses a WASM binary (sql-wasm.wasm) to provide SQLite functionality in the browser or in Electron-based apps like Obsidian. The WASM file must be bundled with your plugin and its URL resolved at runtime.
 *
 * Usage:
 *   const provider = new SqliteProvider();
 *   const db = await provider.openDatabase(dbPath, wasmUrl);
 *   // Use db for queries, then close when done.
 *   db.close();
 *
 * @class SqliteProvider
 */
export class SqliteProvider {
  private SQL: any = null;

  /**
   * Opens a SQLite database using sql.js, given a file path and a WASM URL.
   * Throws on failure.
   *
   * @param dbPath Path to the SQLite database file
   * @param wasmUrl URL to the sql-wasm.wasm file (WebAssembly binary for sql.js)
   * @returns Promise<Database> The opened sql.js Database instance
   *
   * The WASM file is required by sql.js to run SQLite in the browser or in environments like Obsidian plugins.
   * WebAssembly (WASM) is a binary instruction format that allows running high-performance code (like SQLite) in JavaScript environments.
   * The wasmUrl should point to the location of the sql-wasm.wasm file bundled with your plugin.
   */
  async openDatabase(dbPath: string, wasmUrl: string): Promise<Database> {
    try {
      this.SQL = await initSqlJs({ locateFile: () => wasmUrl });
      const fileBuffer = fs.readFileSync(dbPath);
      const db = new this.SQL.Database(fileBuffer);
      // console.log('[SqliteProvider] Database opened with sql.js');
      return db;
    } catch (err) {
      console.error('[SqliteProvider] Failed to open database with sql.js:', err);
      throw new Error('[SqliteProvider] Failed to open database with sql.js: ' + (err instanceof Error ? err.message : err));
    }
  }

  /**
   * Gets the WASM URL for the plugin's sql.js backend.
   *
   * WebAssembly (WASM) is a low-level binary format that allows running native-like code in JavaScript environments.
   * sql.js uses a WASM binary (sql-wasm.wasm) to provide SQLite functionality in the browser or in Electron-based apps like Obsidian.
   * This method resolves the correct URL to the sql-wasm.wasm file bundled with your plugin, so it can be loaded by sql.js.
   *
   * @param plugin The plugin instance
   * @returns string The resolved WASM URL for sql.js
   */
  getWasmUrl(plugin: Plugin): string {
    const pluginId = plugin.manifest.id;
    const wasmPath = normalizePath(`${plugin.app.vault.configDir}/plugins/${pluginId}/sql-wasm.wasm`);
    return plugin.app.vault.adapter.getResourcePath(wasmPath);
  }
}
