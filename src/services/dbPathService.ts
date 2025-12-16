import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * DbPathService
 *
 * Resolves and validates the path to a Things3 SQLite database file for use by the plugin.
 *
 * Features:
 * - Accepts a user-configured path (supports ~ for home directory) or a directory to search for ThingsData-* subfolders.
 * - Validates that the resolved file is a readable SQLite database (by extension and magic header).
 * - Handles ambiguity if multiple ThingsData-* subfolders exist by picking the most recently modified valid database.
 * - Falls back to a default macOS location if no path is provided or found.
 * - Throws an error if no valid database file can be resolved.
 *
 * Usage:
 *   const helper = new DbPathService(configuredPath, directory);
 *   const dbPath = helper.dbPath;
 *
 * Only the dbPath property is exposed; all logic is encapsulated in private workflow methods.
 *
 * @class DbPathService
 */
export class DbPathService {
  /**
   * The resolved path to the Things3 SQLite database.
   */
  dbPath: string;

  /**
   * Constructs a DbPathService and resolves the dbPath using the provided configuredPath and/or directory.
   * Throws if no valid path is found.
   * @param configuredPath - User-configured path to the database file (may use ~ for home directory)
   * @param directory - Directory to search for ThingsData-* subfolders
   */
  constructor(configuredPath?: string, directory?: string) {
    const resolved = this._resolveDbPath(configuredPath, directory);
    if (!resolved) {
      throw new Error('[DbPathService] No valid Things3 database path could be resolved.');
    }
    this.dbPath = resolved;
  }

  /**
   * Main workflow: tries configuredPath, then directory, then fallback.
   * @param configuredPath - User-configured path to the database file
   * @param directory - Directory to search for ThingsData-* subfolders
   * @returns The resolved dbPath or undefined
   */
  private _resolveDbPath(configuredPath?: string, directory?: string): string | undefined {
    if (configuredPath) {
      const pathResult = this._resolveFromConfiguredPath(configuredPath);
      if (pathResult) return pathResult;
    }
    if (directory) {
      const pathResult = this._resolveFromDirectory(directory);
      if (pathResult) return pathResult;
    }
    const fallbackResult = this._resolveFromFallback();
    if (fallbackResult) return fallbackResult;

    console.error('[DbPathService] No valid dbPath found');
    return undefined;
  }

  /**
   * Checks if the file at filePath is a valid SQLite file (by extension and magic header).
   * @param filePath - Path to the file to check
   * @returns True if valid SQLite file, false otherwise
   */
  private _isValidSQLiteFile(filePath: string): boolean {
    if (!fs.existsSync(filePath)) return false;
    if (path.extname(filePath) !== '.sqlite') return false;
    try {
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(16);
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);
      return buffer.toString() === 'SQLite format 3\0';
    } catch (e) {
      console.error('[DbPathService] Error validating SQLite file:', filePath, e);
      return false;
    }
  }

  /**
   * Checks if the file at filePath is readable by the current process.
   * @param filePath - Path to the file to check
   * @returns True if readable, false otherwise
   */
  private _hasReadPermission(filePath: string): boolean {
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch (e) {
      console.error('[DbPathService] No read permission for:', filePath);
      return false;
    }
  }

  /**
   * Checks if the file at filePath is both a valid SQLite file and readable.
   * @param filePath - Path to the file to check
   * @returns True if usable, false otherwise
   */
  private _isUsableSQLiteFile(filePath: string): boolean {
    return this._isValidSQLiteFile(filePath) && this._hasReadPermission(filePath);
  }

  /**
   * Attempts to resolve a usable dbPath from a configured path (handles ~ for home).
   * @param configuredPath - User-configured path to the database file
   * @returns The resolved dbPath or undefined
   */
  private _resolveFromConfiguredPath(configuredPath: string): string | undefined {
    const dbPath = configuredPath.trim();
    let resolvedPath = dbPath;
    if (dbPath.startsWith('~')) {
      resolvedPath = path.join(os.homedir(), dbPath.slice(1));
      // console.log('[DbPathService] Interpreted ~ in configuredPath:', resolvedPath);
    } else {
      // console.log('[DbPathService] Using literal configuredPath:', resolvedPath);
    }
    if (this._isUsableSQLiteFile(resolvedPath)) {
      // console.log('[DbPathService] Found valid dbPath from configuredPath:', resolvedPath);
      return resolvedPath;
    } else {
      console.error('[DbPathService] ConfiguredPath is not a valid SQLite file or lacks permission:', resolvedPath);
      return undefined;
    }
  }

  /**
   * Attempts to resolve a usable dbPath from a directory containing ThingsData-* subfolders.
   * If multiple subfolders exist, delegates to _resolveBestThingsDataDir.
   * @param directory - Directory to search
   * @returns The resolved dbPath or undefined
   */
  private _resolveFromDirectory(directory: string): string | undefined {
    const trimmedDir = directory.trim();
    // console.log('[DbPathService] Checking directory for ThingsData-*:', trimmedDir);
    if (!fs.existsSync(trimmedDir) || !fs.statSync(trimmedDir).isDirectory()) {
      console.error('[DbPathService] Directory does not exist or is not a directory:', trimmedDir);
      return undefined;
    }
    const subdirs = fs.readdirSync(trimmedDir).filter(d => d.startsWith('ThingsData-'));
    // console.log('[DbPathService] Found ThingsData-* subdirs:', subdirs);
    if (subdirs.length === 0) {
      console.error('[DbPathService] No ThingsData-* subdirs found');
      return undefined;
    }
    if (subdirs.length === 1) {
      const candidate = path.join(trimmedDir, subdirs[0], 'main.sqlite');
      if (this._isUsableSQLiteFile(candidate)) {
        // console.log('[DbPathService] Found valid dbPath from directory:', candidate);
        return candidate;
      } else {
        console.error('[DbPathService] main.sqlite not valid or lacks permission in subdir:', candidate);
        return undefined;
      }
    }
    // Ambiguity: multiple ThingsData-* subdirs
    return this._resolveBestThingsDataDir(subdirs, trimmedDir);
  }

  /**
   * Resolves ambiguity when multiple ThingsData-* subfolders exist by picking the most recently modified valid SQLite file.
   * @param subdirs - Array of ThingsData-* subfolder names
   * @param parentDir - Parent directory containing the subfolders
   * @returns The resolved dbPath or undefined
   */
  private _resolveBestThingsDataDir(subdirs: string[], parentDir: string): string | undefined {
    let bestDir: string | undefined;
    let bestTime = 0;
    for (const dir of subdirs) {
      const fullPath = path.join(parentDir, dir, 'main.sqlite');
      if (this._isUsableSQLiteFile(fullPath)) {
        const mtime = fs.statSync(fullPath).mtimeMs;
        if (mtime > bestTime) {
          bestTime = mtime;
          bestDir = fullPath;
        }
      }
    }
    if (bestDir) {
      // console.log('[DbPathService] Resolved ambiguous ThingsData-* to:', bestDir);
      return bestDir;
    }
    console.error('[DbPathService] Could not resolve ambiguous ThingsData-* directories');
    return undefined;
  }

  /**
   * Attempts to resolve a usable dbPath from the default fallback location.
   * Dynamically finds the correct ThingsData-* directory and uses the most recently modified valid database.
   * @returns The resolved dbPath or undefined
   */
  private _resolveFromFallback(): string | undefined {
    const groupContainers = path.join(os.homedir(), 'Library', 'Group Containers');
    // console.log('[DbPathService] Fallback: groupContainers path:', groupContainers);
    const thingsDirs = fs.readdirSync(groupContainers)
      .filter(d => d.startsWith('JLMPQHK86H.com.culturedcode.ThingsMac'));
    // console.log('[DbPathService] Fallback: found Things group containers:', thingsDirs);
    if (thingsDirs.length === 0) {
      console.error('[DbPathService] No Things group container found');
      return undefined;
    }
    // Use the first matching group container (usually only one)
    const thingsContainer = path.join(groupContainers, thingsDirs[0]);
    // console.log('[DbPathService] Fallback: using thingsContainer:', thingsContainer);
    const subdirs = fs.readdirSync(thingsContainer).filter(d => d.startsWith('ThingsData-'));
    // console.log('[DbPathService] Fallback: found ThingsData-* subdirs:', subdirs);
    if (subdirs.length === 0) {
      console.error('[DbPathService] No ThingsData-* subdirs found in fallback');
      return undefined;
    }
    // Log all candidate main.sqlite paths (now with the extra directory)
    const candidates: string[] = [];
    for (const subdir of subdirs) {
      const thingsDbDir = path.join(thingsContainer, subdir, 'Things Database.thingsdatabase');
      if (fs.existsSync(thingsDbDir) && fs.statSync(thingsDbDir).isDirectory()) {
        const candidate = path.join(thingsDbDir, 'main.sqlite');
        candidates.push(candidate);
        // console.log('[DbPathService] Fallback: candidate main.sqlite path:', candidate);
      }
    }
    // Use the same logic as _resolveBestThingsDataDir to pick the best one
    // But pass the full candidate paths and parent dir
    let bestPath: string | undefined;
    let bestTime = 0;
    for (const candidate of candidates) {
      if (this._isUsableSQLiteFile(candidate)) {
        const mtime = fs.statSync(candidate).mtimeMs;
        if (mtime > bestTime) {
          bestTime = mtime;
          bestPath = candidate;
        }
      }
    }
    if (bestPath) {
      console.log('[DbPathService] Fallback: selected dbPath:', bestPath);
      return bestPath;
    }
    console.error('[DbPathService] Could not resolve valid main.sqlite in fallback ThingsData-* directories');
    return undefined;
  }
}
