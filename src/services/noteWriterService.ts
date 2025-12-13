import { Plugin, normalizePath, TFile } from 'obsidian';
import { Things3WorkflowSettings } from '../settings';
import { Database } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import { CacheService } from './cacheService';

/**
 * NoteWriterService
 *
 * Responsible for creating and writing Obsidian notes from Things3 tasks.
 *
 * Features:
 * - Generates note content and frontmatter from Things3 task data, including:
 *   - Title, notes/body, checklist items, and metadata (created, start, end, deadline, status, UUID, link).
 *   - Tags: combines Things3 tags, project/area (if enabled), and custom tags (de-duplicated).
 *   - Customizable section headers for note, details, and checklist.
 * - Handles file/folder creation and overwriting in the Obsidian vault.
 * - Updates the plugin cache to track imported tasks and prevent duplicates.
 * - Converts Core Data absolute dates to ISO strings for frontmatter.
 *
 * Usage:
 *   const noteWriter = new NoteWriterService();
 *   await noteWriter.writeNote(plugin, row, settings, db, pluginCache, thingsService);
 *
 * @class NoteWriterService
 */
export class NoteWriterService {
  /**
   * Writes a note for a Things3 task row, including frontmatter and content, and updates the plugin cache.
   * @param plugin Obsidian plugin instance
   * @param row Task row from Things3
   * @param settings Plugin settings
   * @param db sql.js Database instance
   * @param pluginCache CacheService instance for tracking imports
   * @param thingsService Things3Service instance for checklist queries
   */
  async writeNote(plugin: Plugin, row: any, settings: Things3WorkflowSettings, db: Database, pluginCache: CacheService, thingsService: any) {
    // Fetch checklist items for this task
    const checklist = thingsService.getChecklistItemsByTask(db, row.uuid);
    const { frontmatter, content } = this.prepareContent(row, settings, checklist);
    const { filePath, folder } = this.prepareFilePath(row, settings);
    if (!(await this.ensureFolder(plugin, folder))) return;
    if (!this.isValidFilePath(filePath, row)) return;
    if (!(await this.createFile(plugin, filePath, content, row))) return;
    // Add to plugin cache instead of marking in Things DB
    await pluginCache.load();
    pluginCache.add(row.uuid, { importedAt: new Date().toISOString(), filePath });
    await pluginCache.save();
  }

  /**
   * Prepares the frontmatter and content for the note based on the task row and checklist.
   * @param row Task row from Things3
   * @param settings Plugin settings
   * @param checklist Checklist items for the task
   * @returns Object with frontmatter and content strings
   */
  private prepareContent(row: any, settings: Things3WorkflowSettings, checklist: { title: string; checked: boolean }[]) {
    // Build tags: existing tags, plus project/area if enabled, plus custom tags
    let tags: string[] = [];
    if (row.tags) {
      tags = tags.concat(row.tags.split(',').map((t: string) => t.trim()).filter(Boolean));
    }
    if (settings.includeProjectAsTag && row.project) {
      tags.push(row.project);
    }
    if (settings.includeAreaAsTag) {
      if (row.area) {
        tags.push(row.area);
      } else if (row.project_area) {
        tags.push(row.project_area);
      }
    }
    // Add custom tags from settings
    if (settings.customTags) {
      tags = tags.concat(settings.customTags.split(',').map((t: string) => t.trim()).filter(Boolean));
    }
    // Remove duplicates and empty
    tags = Array.from(new Set(tags)).filter(Boolean);
    const tagString = tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
    const thingsLink = `things:///show?id=${row.uuid}`;
    const thingsCreatedDate = coreDataAbsoluteToISO(row.creationDate) || coreDataAbsoluteToISO(row.startDate) || '';
    const deadlineISO = coreDataAbsoluteToISO(row.deadline);
    const startDateISO = coreDataAbsoluteToISO(row.startDate);
    const endDateISO = coreDataAbsoluteToISO(row.stopDate);
    const t3Status = row.status || '';
    const frontmatter = [
      '---',
      `t3_uuid: ${row.uuid}`,
      `t3_link: ${thingsLink}`,
      `t3_created_date: ${thingsCreatedDate}`,
      `t3_start_date: ${startDateISO}`,
      `t3_end_date: ${endDateISO}`,
      `t3_deadline: ${deadlineISO}`,
      `t3_status: ${t3Status}`,
      `tags: [${tags.map(t => `'#${t}'`).join(', ')}]`,
      '---',
    ].join('\n');
    // Compose content: title, body (if present), deadline, checklist, notes (if present)
    const noteHeader = settings.noteSectionHeader || 'Note';
    const detailsHeader = settings.detailsSectionHeader || 'Details';
    const checklistHeader = settings.checklistSectionHeader || 'Checklist';

    let content = `${frontmatter}\n\n# ${noteHeader}\n${row.title}`;

    if (row.notes && row.notes.trim().length > 0) {
      content += `\n\n# ${detailsHeader}\n${row.notes}`;
    }

    if (checklist && Array.isArray(checklist) && checklist.length > 0) {
      content += `\n\n# ${checklistHeader}`;
      for (const item of checklist) {
        const checked = item.checked ? '[x]' : '[ ]';
        content += `\n- ${checked} ${item.title}`;
      }
    }
    return { frontmatter, content };
  }

  /**
   * Determines the file path and folder for the note based on the task row and settings.
   * @param row Task row from Things3
   * @param settings Plugin settings
   * @returns Object with filePath and folder
   */
  private prepareFilePath(row: any, settings: Things3WorkflowSettings) {
    const safeTitle = (row.title && typeof row.title === 'string' && row.title.trim().length > 0)
      ? row.title
      : 'Untitled';
    const sanitizedTitle = safeTitle.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_').slice(0, 50);
    const filename = `${sanitizedTitle}_${row.uuid.slice(0, 8)}.md`;
    const folder = settings.destinationFolder ? normalizePath(settings.destinationFolder) : '';
    const filePath = folder ? `${folder}/${filename}` : filename;
    return { filePath, folder };
  }

  /**
   * Ensures the destination folder exists in the vault, creating it if necessary.
   * @param plugin Obsidian plugin instance
   * @param folder Folder path
   * @returns True if the folder exists or was created, false otherwise
   */
  private async ensureFolder(plugin: Plugin, folder: string): Promise<boolean> {
    if (!folder) return true;
    let folderExists = plugin.app.vault.getAbstractFileByPath(folder);
    if (!folderExists) {
      try {
        await plugin.app.vault.createFolder(folder);
      } catch (e) {
        folderExists = plugin.app.vault.getAbstractFileByPath(folder);
        if (!folderExists) {
          console.error('Failed to create folder:', folder, e);
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Validates the file path for the note.
   * @param filePath File path string
   * @param row Task row from Things3
   * @returns True if the file path is valid, false otherwise
   */
  private isValidFilePath(filePath: string, row: any): boolean {
    if (!filePath || filePath.indexOf('undefined') !== -1 || filePath.indexOf('null') !== -1) {
      console.error('[NoteWriterService] Skipping file due to invalid filePath:', JSON.stringify(filePath), row);
      return false;
    }
    return true;
  }

  /**
   * Creates or overwrites the note file in the vault.
   * @param plugin Obsidian plugin instance
   * @param filePath File path string
   * @param content Note content
   * @param row Task row from Things3
   * @returns True if the file was created or overwritten, false otherwise
   */
  private async createFile(plugin: Plugin, filePath: string, content: string, row: any): Promise<boolean> {
    try {
      const existing = plugin.app.vault.getAbstractFileByPath(filePath);
      if (existing && existing instanceof TFile) {
        // Overwrite the file if it already exists
        await plugin.app.vault.modify(existing, content);
        return true;
      } else {
        await plugin.app.vault.create(filePath, content);
        return true;
      }
    } catch (e) {
      console.error('Failed to create or overwrite file:', JSON.stringify(filePath), e);
      return false;
    }
  }
}

/**
 * Converts a Core Data absolute date (seconds since 2001-01-01T00:00:00Z) to an ISO string.
 * @param abs Absolute date as number or string
 * @returns ISO date string or empty string if invalid
 */
function coreDataAbsoluteToISO(abs: number | string | undefined): string {
  if (!abs) return '';
  const absNum = typeof abs === 'string' ? parseFloat(abs) : abs;
  if (isNaN(absNum)) return '';
  // Core Data epoch: 2001-01-01T00:00:00Z
  const coreDataEpoch = Date.UTC(2001, 0, 1, 0, 0, 0, 0);
  const ms = coreDataEpoch + absNum * 1000;
  return new Date(ms).toISOString();
}
